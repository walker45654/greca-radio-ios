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

@objc(RadioPlayer)
public class RadioPlayer: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RadioPlayer"
    public let jsName = "RadioPlayer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setMetadata", returnType: CAPPluginReturnPromise)
    ]

    private var player: AVPlayer?
    private var currentItem: AVPlayerItem?
    private var currentVolume: Float = 0.85
    private var statusObserver: NSKeyValueObservation?
    private var timeControlObserver: NSKeyValueObservation?
    private var itemEndObserver: NSObjectProtocol?
    private var itemFailedObserver: NSObjectProtocol?
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
            print("RadioPlayer: AVAudioSession error: \(error)")
        }
    }

    private func setupRemoteCommands() {
        guard !commandsConfigured else { return }
        commandsConfigured = true

        let center = MPRemoteCommandCenter.shared()

        center.playCommand.isEnabled = true
        center.playCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.player?.play()
            self.notifyListeners("remoteAction", data: ["action": "play"])
            return .success
        }

        center.pauseCommand.isEnabled = true
        center.pauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.player?.pause()
            self.notifyListeners("remoteAction", data: ["action": "pause"])
            return .success
        }

        center.togglePlayPauseCommand.isEnabled = true
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            if self.player?.timeControlStatus == .playing {
                self.player?.pause()
                self.notifyListeners("remoteAction", data: ["action": "pause"])
            } else {
                self.player?.play()
                self.notifyListeners("remoteAction", data: ["action": "play"])
            }
            return .success
        }

        center.nextTrackCommand.isEnabled = true
        center.nextTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.notifyListeners("remoteAction", data: ["action": "next"])
            return .success
        }

        center.previousTrackCommand.isEnabled = true
        center.previousTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.notifyListeners("remoteAction", data: ["action": "previous"])
            return .success
        }
    }

    @objc public func play(_ call: CAPPluginCall) {
        let urlStr = call.getString("url")
        if let vol = call.getFloat("volume") {
            currentVolume = max(0.0, min(1.0, vol))
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if let urlStr = urlStr, let url = URL(string: urlStr) {
                self.statusObserver?.invalidate()
                self.statusObserver = nil
                self.timeControlObserver?.invalidate()
                self.timeControlObserver = nil

                if let obs = self.itemEndObserver {
                    NotificationCenter.default.removeObserver(obs)
                    self.itemEndObserver = nil
                }
                if let obs = self.itemFailedObserver {
                    NotificationCenter.default.removeObserver(obs)
                    self.itemFailedObserver = nil
                }

                let item = AVPlayerItem(url: url)
                self.currentItem = item

                if self.player == nil {
                    let p = AVPlayer(playerItem: item)
                    p.automaticallyWaitsToMinimizeStalling = true
                    p.volume = self.currentVolume
                    self.player = p
                } else {
                    self.player?.replaceCurrentItem(with: item)
                    self.player?.volume = self.currentVolume
                }

                self.timeControlObserver = self.player?.observe(\.timeControlStatus, options: [.new, .initial]) { [weak self] (player, _) in
                    guard let self = self else { return }
                    DispatchQueue.main.async {
                        switch player.timeControlStatus {
                        case .playing:
                            self.notifyListeners("status", data: ["state": "playing"])
                        case .waitingToPlayAtSpecifiedRate:
                            self.notifyListeners("status", data: ["state": "waiting"])
                        case .paused:
                            self.notifyListeners("status", data: ["state": "paused"])
                        @unknown default:
                            break
                        }
                    }
                }

                self.statusObserver = item.observe(\.status, options: [.new, .initial]) { [weak self] (item, _) in
                    guard let self = self else { return }
                    DispatchQueue.main.async {
                        if item.status == .failed {
                            print("AVPlayerItem failed: \(String(describing: item.error))")
                            self.notifyListeners("status", data: ["state": "error", "error": item.error?.localizedDescription ?? "stream_error"])
                        }
                    }
                }

                self.itemEndObserver = NotificationCenter.default.addObserver(
                    forName: .AVPlayerItemDidPlayToEndTime,
                    object: item,
                    queue: .main
                ) { [weak self] _ in
                    self?.notifyListeners("status", data: ["state": "ended"])
                }

                self.itemFailedObserver = NotificationCenter.default.addObserver(
                    forName: .AVPlayerItemFailedToPlayToEndTime,
                    object: item,
                    queue: .main
                ) { [weak self] _ in
                    self?.notifyListeners("status", data: ["state": "error"])
                }

                self.player?.play()
                call.resolve(["playing": true, "volume": self.currentVolume])
            } else if let player = self.player {
                player.play()
                call.resolve(["playing": true, "volume": self.currentVolume])
            } else {
                call.reject("Must provide valid url")
            }
        }
    }

    @objc public func pause(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.player?.pause()
            call.resolve(["playing": false])
        }
    }

    @objc public func setVolume(_ call: CAPPluginCall) {
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
            self.player?.volume = clamped
            call.resolve(["volume": clamped])
        }
    }

    @objc public func getVolume(_ call: CAPPluginCall) {
        call.resolve(["volume": self.currentVolume])
    }

    @objc public func setMetadata(_ call: CAPPluginCall) {
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
