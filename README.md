# Greca 99,4 FM - Mobile Application (Android, iOS, CarPlay)

Το ολοκληρωμένο mobile application του **Greca 99,4 FM («Το ραδιόφωνο της Ηλείας»)**, σχεδιασμένο σε **Light Theme (Άσπρο mode)**, με κορυφαία αισθητική και άμεση υποστήριξη για **Google Play Store**, **Apple App Store**, **Apple CarPlay** και **Android Auto**.

---

## 🌟 Τι Περιλαμβάνει η Εφαρμογή:

### 1. Multi-Station Web Radios Network (7 Κανάλια)
* **Greca 99,4 Live (HQ - 320kbps HD):** Ο κεντρικός σταθμός σε πραγματικό χρόνο.
* **Greca Λαϊκό:** Αυθεντικά λαϊκά τραγούδια.
* **Greca Party:** Dance hits & remixes.
* **Greca Ερωτικό:** Ερωτικές μπαλάντες.
* **Greca Έντεχνο:** Έντεχνη ελληνική μουσική.
* **Greca Lounge:** Chillout & ambient ρυθμοί.
* **Greca Γλέντι:** Δημοτικά και παραδοσιακά.
* *Φίλτρα κατηγοριών και σύστημα αγαπημένων (Favorites με καρδούλα).*

### 2. Apple CarPlay & Android Auto 🚗
* Ειδική λειτουργία προσομοίωσης οθόνης αυτοκινήτου με μεγάλα ασφαλή κουμπιά, γρήγορη επιλογή σταθμού από το τιμόνι / οθόνη αφής.
* Έτοιμες ρυθμίσεις στο `app.json` με το απαραίτητο Apple CarPlay entitlement (`com.apple.developer.carplay-audio`).

### 3. Persistent Audio Player & Full-Screen Modal
* **Mini Player:** Παραμένει πάντα στο κάτω μέρος καθώς ο χρήστης διαβάζει νέα ή βλέπει το πρόγραμμα.
* **Full Screen Player:** Ανοίγει με άγγιγμα στο mini player, περιλαμβάνει:
  * Μεγάλο εξώφυλλο άλμπουμ.
  * Ρύθμιση έντασης (Volume slider).
  * **Sleep Timer:** Χρονοδιακόπτης ύπνου (15, 30, 45, 60 λεπτά) που κλείνει αυτόματα τη μουσική.
  * Επιλογέα ποιότητας (HQ 320k / Eco 128k).
  * Κουμπί κοινοποίησης στα social media.

### 4. Άρθρα, Lifestyle & Νέα (από greca994.gr)
* Ενσωματωμένο live feed με άρθρα τεχνολογίας, μουσικής και επικαιρότητας.

### 5. Πρόγραμμα Εκπομπών & Παραγωγοί
* Timeline της ημέρας με τις εκπομπές, τους παραγωγούς και τις ώρες μετάδοσης.

### 6. Studio Connect (Άμεση Επικοινωνία)
* Ένα πάτημα για WhatsApp (`+306940340507`), Viber, απευθείας τηλεφωνική κλήση στο studio και email.
* Φόρμα αποστολής αφιέρωσης και παραγγελιάς τραγουδιού στον αέρα.

### 7. Monetization & Χορηγοί
* Ειδική κάρτα χορηγού / διαφήμισης για τοπικές επιχειρήσεις της Ηλείας ή ενσωμάτωση Google AdMob banners.

---

## 🚀 Πώς να το δοκιμάσετε ΤΩΡΑ:

Ο τοπικός εξυπηρετητής τρέχει ήδη! Ανοίξτε στον browser σας:
👉 **[http://localhost:8088](http://localhost:8088)**

*Μπορείτε να πατήσετε "Άκου Ζωντανά" για να ακούσετε το πραγματικό live stream του Greca 99,4, να αλλάξετε web radios, να δοκιμάσετε το sleep timer και την καρτέλα CarPlay!*

---

## 📱 Οδηγός Ανέβασμα σε Google Play Store & Apple App Store

### Βήμα 1: React Native / Expo Export
Ο κώδικας και η αρχιτεκτονική είναι πλήρως συμβατά με το React Native (Expo). Τα αρχεία διαμόρφωσης βρίσκονται ήδη στον φάκελο:
* `app.json`: Ρυθμίσεις bundle ID (`gr.greca994.app`), Background Audio modes, CarPlay entitlement.
* `eas.json`: Ρυθμίσεις παραγωγής `.aab` (Android App Bundle) και `.ipa` (iOS).

### Βήμα 2: Build στο Cloud (Χωρίς απαίτηση Mac για το iOS)
1. Εγκατάσταση του EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Σύνδεση στον Expo λογαριασμό σας:
   ```bash
   eas login
   ```
3. Δημιουργία των αρχείων για τα Stores:
   * **Για Android (Google Play):**
     ```bash
     eas build --platform android --profile production
     ```
     *(Παράγει το αρχείο `.aab` που ανεβαίνει στο Google Play Console).*
   * **Για iOS (App Store):**
     ```bash
     eas build --platform ios --profile production
     ```
     *(Γίνεται compile στους servers της Apple/Expo και στέλνεται αυτόματα στο App Store Connect).*

### Βήμα 3: Λογαριασμοί Προγραμματιστή
1. **Google Play Console:** Κόστος $25 (one-time). Ανεβάζετε το `.aab`, βάζετε screenshots, περιγραφή και το link του Privacy Policy από το `greca994.gr`.
2. **Apple Developer Program:** Κόστος $99/χρόνο. Ενεργοποιείτε το CarPlay Audio entitlement και υποβάλλετε το app για έγκριση.
