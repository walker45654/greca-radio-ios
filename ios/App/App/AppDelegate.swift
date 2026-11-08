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

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

@objc(VolumePlugin)
public class VolumePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VolumePlugin"
    public let jsName = "VolumePlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVolume", returnType: CAPPluginReturnPromise)
    ]

    private var volumeView: MPVolumeView?
    private var volumeSlider: UISlider?

    public func setupVolumeView(on parentView: UIView) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if self.volumeView == nil {
                let vv = MPVolumeView(frame: CGRect(x: -2000, y: -2000, width: 1, height: 1))
                vv.alpha = 0.001
                vv.clipsToBounds = true
                parentView.addSubview(vv)
                self.volumeView = vv

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                    self?.findAndCacheSlider()
                }
            }
        }
    }

    private func findAndCacheSlider() -> UISlider? {
        if let s = self.volumeSlider { return s }
        if let vv = self.volumeView {
            for subview in vv.subviews {
                if let slider = subview as? UISlider {
                    self.volumeSlider = slider
                    return slider
                }
            }
        }
        return nil
    }

    @objc func setVolume(_ call: CAPPluginCall) {
        guard let volume = call.getFloat("volume") else {
            call.reject("Must provide volume")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                call.resolve(["volume": volume])
                return
            }
            let clamped = max(0.0, min(1.0, volume))
            if let slider = self.findAndCacheSlider() {
                slider.setValue(clamped, animated: false)
                slider.sendActions(for: .valueChanged)
                call.resolve(["volume": clamped])
            } else {
                let keyWindow = UIApplication.shared.connectedScenes
                    .compactMap { $0 as? UIWindowScene }
                    .flatMap { $0.windows }
                    .first(where: { $0.isKeyWindow })
                if let kw = keyWindow {
                    self.setupVolumeView(on: kw)
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
                    if let slider = self?.findAndCacheSlider() {
                        slider.setValue(clamped, animated: false)
                        slider.sendActions(for: .valueChanged)
                    }
                    call.resolve(["volume": clamped])
                }
            }
        }
    }

    @objc func getVolume(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let vol = AVAudioSession.sharedInstance().outputVolume
            call.resolve(["volume": vol])
        }
    }
}
