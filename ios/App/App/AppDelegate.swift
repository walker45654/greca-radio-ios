import UIKit
import Capacitor
import AVFoundation
import MediaPlayer

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true)
        } catch {
            print("AVAudioSession configuration failed: \(error)")
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

@objc(RadioPlayerPlugin)
public class RadioPlayerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RadioPlayerPlugin"
    public let jsName = "RadioPlayer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "playStream", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pauseStream", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playPreview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pausePreview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopPreview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setMetadata", returnType: CAPPluginReturnPromise)
    ]

    private var streamPlayer: AVPlayer?
    private var previewPlayer: AVPlayer?
    private var previewEndObserver: NSObjectProtocol?
    private var previewErrorObserver: NSObjectProtocol?
    private var currentVolume: Float = 0.85
    private var commandsConfigured = false

    public override func load() {
        super.load()
        setupAudioSession()
        setupRemoteCommands()
    }

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true)
        } catch {
            print("RadioPlayerPlugin: AVAudioSession error: \(error)")
        }
    }

    private func setupRemoteCommands() {
        guard !commandsConfigured else { return }
        commandsConfigured = true

        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.streamPlayer?.play()
            self.notifyListeners("remoteAction", data: ["action": "play"])
            return .success
        }

        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.streamPlayer?.pause()
            self.previewPlayer?.pause()
            self.notifyListeners("remoteAction", data: ["action": "pause"])
            return .success
        }

        commandCenter.togglePlayPauseCommand.isEnabled = true
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.notifyListeners("remoteAction", data: ["action": "toggle"])
            return .success
        }

        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.notifyListeners("remoteAction", data: ["action": "next"])
            return .success
        }

        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.notifyListeners("remoteAction", data: ["action": "previous"])
            return .success
        }
    }

    @objc func playStream(_ call: CAPPluginCall) {
        guard let urlStr = call.getString("url"), let url = URL(string: urlStr) else {
            call.reject("Must provide valid url")
            return
        }

        if let vol = call.getFloat("volume") {
            currentVolume = max(0.0, min(1.0, vol))
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.previewPlayer?.pause()
            self.previewPlayer = nil

            let item = AVPlayerItem(url: url)
            if self.streamPlayer == nil {
                self.streamPlayer = AVPlayer(playerItem: item)
            } else {
                self.streamPlayer?.replaceCurrentItem(with: item)
            }
            self.streamPlayer?.automaticallyWaitsToMinimizeStalling = false
            self.streamPlayer?.volume = self.currentVolume
            self.streamPlayer?.play()

            call.resolve(["playing": true, "volume": self.currentVolume])
        }
    }

    @objc func pauseStream(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.streamPlayer?.pause()
            call.resolve(["playing": false])
        }
    }

    @objc func playPreview(_ call: CAPPluginCall) {
        guard let urlStr = call.getString("url"), let url = URL(string: urlStr) else {
            call.reject("Must provide valid url")
            return
        }

        if let vol = call.getFloat("volume") {
            currentVolume = max(0.0, min(1.0, vol))
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.streamPlayer?.pause()

            if let obs = self.previewEndObserver {
                NotificationCenter.default.removeObserver(obs)
                self.previewEndObserver = nil
            }
            if let obs = self.previewErrorObserver {
                NotificationCenter.default.removeObserver(obs)
                self.previewErrorObserver = nil
            }

            let item = AVPlayerItem(url: url)
            let player = AVPlayer(playerItem: item)
            player.automaticallyWaitsToMinimizeStalling = false
            player.volume = self.currentVolume
            self.previewPlayer = player

            self.previewEndObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: item,
                queue: .main
            ) { [weak self] _ in
                self?.notifyListeners("previewState", data: ["state": "ended"])
            }

            self.previewErrorObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemFailedToPlayToEndTime,
                object: item,
                queue: .main
            ) { [weak self] _ in
                self?.notifyListeners("previewState", data: ["state": "error"])
            }

            player.play()
            call.resolve(["playing": true, "volume": self.currentVolume])
        }
    }

    @objc func pausePreview(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.previewPlayer?.pause()
            call.resolve(["playing": false])
        }
    }

    @objc func stopPreview(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let obs = self.previewEndObserver {
                NotificationCenter.default.removeObserver(obs)
                self.previewEndObserver = nil
            }
            if let obs = self.previewErrorObserver {
                NotificationCenter.default.removeObserver(obs)
                self.previewErrorObserver = nil
            }
            self.previewPlayer?.pause()
            self.previewPlayer = nil
            call.resolve(["stopped": true])
        }
    }

    @objc func setVolume(_ call: CAPPluginCall) {
        guard let volume = call.getFloat("volume") else {
            call.reject("Must provide volume")
            return
        }

        let clamped = max(0.0, min(1.0, volume))
        self.currentVolume = clamped

        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                call.resolve(["volume": clamped])
                return
            }
            self.streamPlayer?.volume = clamped
            self.previewPlayer?.volume = clamped
            call.resolve(["volume": clamped])
        }
    }

    @objc func getVolume(_ call: CAPPluginCall) {
        call.resolve(["volume": self.currentVolume])
    }

    @objc func setMetadata(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "Greca FM 99,4"
        let artist = call.getString("artist") ?? "Μόνο Επιτυχίες"
        let station = call.getString("station") ?? "Greca FM 99,4"
        let artworkUrlStr = call.getString("artworkUrl")
        let isPlaying = call.getBool("isPlaying") ?? true

        DispatchQueue.main.async {
            var nowPlayingInfo = [String: Any]()
            nowPlayingInfo[MPMediaItemPropertyTitle] = title
            nowPlayingInfo[MPMediaItemPropertyArtist] = artist
            nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = station
            nowPlayingInfo[MPNowPlayingInfoPropertyIsLiveStream] = true
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0

            MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

            if let artStr = artworkUrlStr, let artUrl = URL(string: artStr) {
                URLSession.shared.dataTask(with: artUrl) { (data, _, _) in
                    if let data = data, let img = UIImage(data: data) {
                        DispatchQueue.main.async {
                            var updated = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
                            let artwork = MPMediaItemArtwork(boundsSize: img.size) { _ in img }
                            updated[MPMediaItemPropertyArtwork] = artwork
                            MPNowPlayingInfoCenter.default().nowPlayingInfo = updated
                        }
                    }
                }.resume()
            }
            call.resolve()
        }
    }
}
