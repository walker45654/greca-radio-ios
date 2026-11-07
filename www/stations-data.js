// Greca FM 99,4 - Complete Data Schema with Real-Time Channels & Preloaded History
var APP_DATA = {
  station: {
    name: "Greca FM 99,4",
    frequency: "99,4 FM",
    tagline: "Το ραδιόφωνο της Ηλείας",
    logo: "assets/greca_black_logo.png",
    website: "https://greca994.gr",
    phone: "+306940340507",
    phoneDisplay: "6940 340 507",
    email: "info@greca994.gr"
  },
  channels: [
    {
      id: "main-hq",
      name: "Greca FM 99,4",
      slug: "main",
      category: "main",
      categoryName: "Κεντρικός Σταθμός",
      streamUrl: "https://cast2.radiohost.ovh/grecafm?mp=/stream",
      backupStreamUrl: "https://one.cloudstreaming.eu/proxy/grecabackup/stream",
      bitrate: "320 kbps HD",
      image: "assets/Greca Fm 99,4 mayro logo jpg (1).jpg",
      logo: "assets/Greca Fm 99,4 mayro logo jpg (1).jpg",
      nowPlayingTxt: "https://greca994.gr/playlist/NowOnAir.xml",
      artworkUrl: "assets/Greca Fm 99,4 mayro logo jpg (1).jpg",
      description: "Μόνο Επιτυχίες."
    },
    {
      id: "greca-entexno",
      name: "Greca Έντεχνο",
      slug: "entexno",
      category: "entexna",
      categoryName: "Έντεχνα",
      streamUrl: "https://one.cloudstreaming.eu/proxy/entexnonew/stream",
      bitrate: "192 kbps",
      image: "assets/stations/entexno.jpg",
      logo: "assets/stations/entexno.jpg",
      nowPlayingTxt: "https://greca994.gr/artwork/entexno/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/entexno/artwork.jpg",
      description: "Σπουδαίες ερμηνείες και τα ομορφότερα έντεχνα ακούσματα."
    },
    {
      id: "greca-laiko",
      name: "Greca Λαϊκό",
      slug: "laiko",
      category: "laika",
      categoryName: "Λαϊκά",
      streamUrl: "https://one.cloudstreaming.eu/proxy/laikonew/stream",
      bitrate: "192 kbps",
      image: "assets/stations/laiko.jpg",
      logo: "assets/stations/laiko.jpg",
      nowPlayingTxt: "https://greca994.gr/artwork/laiko/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/laiko/artwork.jpg",
      description: "Αυθεντικά κλασικά και νέα λαϊκά τραγούδια."
    },
    {
      id: "greca-erotiko",
      name: "Greca Ερωτικό",
      slug: "erwtiko",
      category: "erwtika",
      categoryName: "Ερωτικά",
      streamUrl: "https://one.cloudstreaming.eu/proxy/erwtikonew/stream",
      bitrate: "192 kbps",
      image: "assets/stations/erwtiko.jpg",
      logo: "assets/stations/erwtiko.jpg",
      nowPlayingTxt: "https://greca994.gr/artwork/erwtiko/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/erwtiko/artwork.jpg",
      description: "Μελωδικές μπαλάντες και ερωτικές επιτυχίες."
    },
    {
      id: "greca-party",
      name: "Greca Party",
      slug: "party",
      category: "dance",
      categoryName: "Party / Dance",
      streamUrl: "https://one.cloudstreaming.eu/proxy/partynew/stream",
      bitrate: "192 kbps",
      image: "assets/stations/party.jpg",
      logo: "assets/stations/party.jpg",
      nowPlayingTxt: "https://greca994.gr/artwork/party/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/party/artwork.jpg",
      description: "Non-stop dance ρυθμοί, club tracks και δυνατά remixes."
    },
    {
      id: "greca-lounge",
      name: "Greca Lounge",
      slug: "lounge",
      category: "chill",
      categoryName: "Chill & Lounge",
      streamUrl: "https://one.cloudstreaming.eu/proxy/loungenew/stream",
      bitrate: "192 kbps",
      image: "assets/stations/lounge.png",
      logo: "assets/stations/lounge.png",
      nowPlayingTxt: "https://greca994.gr/artwork/Lounge/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/Lounge/artwork.jpg",
      description: "Χαλαρωτική ατμόσφαιρα, chillout ρυθμοί και lounge beats."
    },
    {
      id: "greca-glenti",
      name: "Greca Γλέντι",
      slug: "glenti",
      category: "traditional",
      categoryName: "Παραδοσιακά",
      streamUrl: "https://one.cloudstreaming.eu/proxy/glentinew/stream",
      bitrate: "192 kbps",
      image: "assets/stations/glenti.jpg",
      logo: "assets/stations/glenti.jpg",
      nowPlayingTxt: "https://greca994.gr/artwork/glenti/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/glenti/artwork.jpg",
      description: "Γνήσια παραδοσιακά, νησιώτικα και δημοτικά για αληθινό γλέντι."
    },
    {
      id: "greca-xmas",
      name: "Greca Christmas",
      slug: "xmas",
      category: "seasonal",
      categoryName: "Χριστουγεννιάτικα",
      streamUrl: "https://one.cloudstreaming.eu/proxy/xmas/stream",
      bitrate: "192 kbps",
      image: "assets/stations/xmas.jpg",
      logo: "assets/stations/xmas.jpg",
      nowPlayingTxt: "https://greca994.gr/artwork/xmas/nowplaying.txt",
      artworkUrl: "https://greca994.gr/artwork/xmas/artwork.jpg",
      description: "Αγαπημένες χριστουγεννιάτικες μελωδίες, γιορτινή μαγεία και εορταστικά classics."
    }
  ],
  initialHistoriesByStation: {
    "main": [
        {
            "title": "ΚΑΠΝΟΓΟΝΑ",
            "artist": "ΠΕΤΡΟΣ ΙΑΚΩΒΙΔΗΣ",
            "time": "17:17",
            "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76544.jpg"
        },
        {
            "title": "ΡΕΥΜΑ",
            "artist": "ΚΩΝΣΤΑΝΤΙΝΟΣ ΑΡΓΥΡΟΣ",
            "time": "17:13",
            "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76697.jpg"
        },
        {
            "title": "ΤΟ ΦΩΣ ΣΤΗΝ ΨΥΧΗ",
            "artist": "ΕΛΕΝΑ ΠΑΠΑΡΙΖΟΥ",
            "time": "17:10",
            "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76506.jpg"
        },
        {
            "title": "ΠΟΙΟΣ ΝΑ ΣΟΥ ΤΟ ΠΕΙ",
            "artist": "TOQUEL FEAT LILA",
            "time": "17:07",
            "image": "assets/stations/main.png"
        },
        {
            "title": "ΕΝΟΧΟ ΚΟΡΜΙ",
            "artist": "ΝΙΚΟΣ ΟΙΚΟΝΟΜΟΠΟΥΛΟΣ",
            "time": "17:01",
            "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76633.jpg"
        }
    ],
    "laiko": [
        {
                "title": "ΘΕΜΗΣ ΑΔΑΜΑΝΤΙΔΗΣ ΑΝΑΨΕ ΜΟΥ ΕΝΑ ΤΣΙΓΑΡΟ",
                "artist": "ΜΙΧΑΛΗΣ ΧΑΤΖΗΓΙΑΝΝΗΣ",
                "time": "16:25",
                "image": "https://greca994.gr/artwork/laiko/artwork.jpg"
        },
        {
                "title": "ΠΑΙΔΙ ΜΟΥ ΩΡΑ ΣΟΥ ΚΑΛΗ",
                "artist": "ΜΙΧΑΛΗΣ ΒΙΟΛΑΡΗΣ",
                "time": "16:22",
                "image": "https://greca994.gr/artwork/laiko/artwork.jpg"
        },
        {
                "title": "ΤΟΣΗ ΚΑΡΔΙΑ ΤΟΣΗ ΑΓΑΠΗ",
                "artist": "ΦΙΛΙΠΠΟΣ ΝΙΚΟΛΑΟΥ",
                "time": "16:19",
                "image": "https://greca994.gr/artwork/laiko/artwork.jpg"
        },
        {
                "title": "ΜΑΡΙΝΑ ΒΛΑΧΑΚΗ ΚΡΑΤΗΣΕ ΜΕ",
                "artist": "ΣΤΡΑΤΟΣ ΔΙΟΝΥΣΙΟΥ",
                "time": "16:13",
                "image": "https://greca994.gr/artwork/laiko/artwork.jpg"
        },
        {
                "title": "ΜΠΡΑΒΟ ΣΟΥ ΚΥΡΑ ΜΟΥ",
                "artist": "ΠΑΟΛΑ",
                "time": "16:10",
                "image": "https://greca994.gr/artwork/laiko/artwork.jpg"
        }
],
    "entexno": [
        {
                "title": "ΤΙ ΝΑ ΘΥΜΗΘΩ (LOIZOS P.RMX)",
                "artist": "ΕΛΕΝΗ ΤΣΑΡΙΔΟΥ",
                "time": "16:28",
                "image": "https://greca994.gr/artwork/entexno/artwork.jpg"
        },
        {
                "title": "ΚΙ ΑΝ ΣΕ ΘΕΛΩ",
                "artist": "ΓΙΑΝΝΗΣ ΚΟΤΣΙΡΑΣ",
                "time": "16:25",
                "image": "https://greca994.gr/artwork/entexno/artwork.jpg"
        },
        {
                "title": "ΑΥΤΗ ΕΙΝΑΙ Η ΖΩΗ",
                "artist": "ΠΑΝΟΣ ΜΟΥΖΟΥΡΑΚΗΣ",
                "time": "16:22",
                "image": "https://greca994.gr/artwork/entexno/artwork.jpg"
        },
        {
                "title": "ΤΑ ΒΕΓΓΑΛΙΚΑ ΣΟΥ ΜΑΤΙΑ",
                "artist": "ΓΙΩΡΓΟΣ ΝΤΑΛΑΡΑΣ",
                "time": "16:19",
                "image": "https://greca994.gr/artwork/entexno/artwork.jpg"
        },
        {
                "title": "ΝΟΣΤΑΛΓΟΣ ΤΟΥ ROCK 'N' ROLL",
                "artist": "ΓΙΑΝΝΗΣ ΓΙΟΚΑΡΙΝΗΣ",
                "time": "16:16",
                "image": "https://greca994.gr/artwork/entexno/artwork.jpg"
        }
],
    "erwtiko": [
        {
                "title": "WONDERFUL LIFE",
                "artist": "ZUCCHERO",
                "time": "16:28",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/f4/09/85/f409850b-143b-0bde-e9f8-3c054bb57113/00602517508156.rgb.jpg/300x300bb.jpg"
        },
        {
                "title": "ΜΙΛΑ ΤΗΣ",
                "artist": "ΣΑΚΗΣ ΡΟΥΒΑΣ",
                "time": "16:22",
                "image": "https://greca994.gr/artwork/erwtiko/artwork.jpg"
        },
        {
                "title": "FRAGILE",
                "artist": "STING",
                "time": "16:19",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/54/86/5d/54865d4d-ed96-a757-c2a0-56acacf5c523/mzi.jpcqkkck.jpg/300x300bb.jpg"
        },
        {
                "title": "ΨΑΞΕ ΜΕ",
                "artist": "ΔΑΝΤΗΣ",
                "time": "16:16",
                "image": "https://greca994.gr/artwork/erwtiko/artwork.jpg"
        },
        {
                "title": "ΑΝ ΕΙΣΑΙ ΑΣΤΕΡΙ",
                "artist": "ΝΙΚΟΣ ΒΕΡΤΗΣ",
                "time": "16:10",
                "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_66349.jpg"
        }
],
    "party": [
        {
                "title": "HERE FOR ONE",
                "artist": "BLAZIN SQUAD",
                "time": "16:25",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/49/20/f9/4920f951-39fe-0469-9fee-97d1be59efaa/887158524967_Cover.jpg/300x300bb.jpg"
        },
        {
                "title": "FIESTA LOCA (RADIO EDIT)",
                "artist": "DESAPARECIDOS",
                "time": "16:22",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/0f/a0/8a/0fa08a04-bdd9-d954-c773-7e245158ddcd/23UMGIM58714.rgb.jpg/300x300bb.jpg"
        },
        {
                "title": "DARK BEAT",
                "artist": "OSCAR G & RALPH FALCON",
                "time": "16:16",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4d/d8/ed/4dd8ed53-0414-107e-dfcb-3e8da01f0ae3/s05.whfyikel.jpg/300x300bb.jpg"
        },
        {
                "title": "WHAT A FEELING(FLASHDANCE)",
                "artist": "GLOBAL DEEJAYS",
                "time": "16:10",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music/29/4f/04/mzi.cvxgqykl.jpg/300x300bb.jpg"
        },
        {
                "title": "GOOD FEELING",
                "artist": "FLO RIDA",
                "time": "16:07",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/eb/ca/0d/ebca0d0d-3c73-686a-285a-f5899d1e0f25/075679954046.jpg/300x300bb.jpg"
        }
],
    "lounge": [
        {
                "title": "MIRACLE",
                "artist": "MEDUSA",
                "time": "16:28",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music/ec/b0/1c/mzi.gwuyoqvp.jpg/300x300bb.jpg"
        },
        {
                "title": "FADE AWAY",
                "artist": "THUNDER",
                "time": "16:25",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music6/v4/7c/5e/2b/7c5e2b30-cc2e-409e-5bb0-003daec57762/96741015823.jpg/300x300bb.jpg"
        },
        {
                "title": "TIRED",
                "artist": "LE BOBER",
                "time": "16:22",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/40/5f/4e/405f4e21-86ee-5831-b007-eb911196ea26/5063416776179_cover.jpg/300x300bb.jpg"
        },
        {
                "title": "SLOW DANCING IN A BURNING ROOM",
                "artist": "JOHN MAYER",
                "time": "16:19",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/7a/a0/f4/7aa0f487-f983-390e-73ef-005115eea1e0/dj.oqpplyfm.jpg/300x300bb.jpg"
        },
        {
                "title": "FADE OUT LINES (THE AVENER REWORK)",
                "artist": "THE AVENER",
                "time": "16:13",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/62/b4/77/62b477f2-e60e-e446-94a5-a43f5ec99569/780163564921.jpg/300x300bb.jpg"
        }
],
    "glenti": [
        {
                "title": "LYGARIA",
                "artist": "STAMATIS GONIDIS",
                "time": "16:28",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music82/v4/f2/dd/e9/f2dde945-bfe9-2bf0-840b-853c63620a8d/cover.jpg/300x300bb.jpg"
        },
        {
                "title": "STIS PARGAS TON ANIFORO",
                "artist": "ALEKOS ZAZOPOULOS",
                "time": "16:25",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/84/7f/c5/847fc5eb-a313-fb40-8a77-c40ac69c6ded/cover.jpg/300x300bb.jpg"
        },
        {
                "title": "THE SUN IS SETTING (THE SUN IS IS SETTING)",
                "artist": "ALEKOS KITSAKIS",
                "time": "16:22",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0a/ff/e0/0affe0c4-95d9-f1a6-ebe8-a225309dda37/886788556744.jpg/300x300bb.jpg"
        },
        {
                "title": "STIN EFHI STO KALO",
                "artist": "VIKI PANTAZI",
                "time": "16:19",
                "image": "https://greca994.gr/artwork/glenti/artwork.jpg"
        },
        {
                "title": "POTE VOUDAS POTE KOUDAS (VALENTINO 2K17 MIX)",
                "artist": "PANOS KALIDIS",
                "time": "16:16",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/13/5c/0d/135c0d65-be97-ec9b-6ff2-6cf1a72a4745/cover.jpg/300x300bb.jpg"
        }
],
    "xmas": [
        {
                "title": "LINUS AND LUCY",
                "artist": "VINCE GUARALDI TRIO",
                "time": "16:25",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e8/83/ea/e883eade-52e2-fa74-fd1e-a69c114ef9ae/12CMGIM34347.rgb.jpg/300x300bb.jpg"
        },
        {
                "title": "ITS BEGINNING TO LOOK A LOT LIKE CHRISTMAS",
                "artist": "ALEXANDER THOMA",
                "time": "16:22",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/37/2d/6e/372d6e16-7a32-91f0-1a03-0f2d9dbe389e/093624942788.jpg/300x300bb.jpg"
        },
        {
                "title": "THE MAN WITH ALL THE TOYS (1991 REMIX)",
                "artist": "THE BEACH BOYS",
                "time": "16:19",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/60/c1/1c/60c11c1d-9e17-9f16-778d-d6c58162ca6f/13UADIM60806.rgb.jpg/300x300bb.jpg"
        },
        {
                "title": "FROSTY THE SNOWMAN",
                "artist": "ELLA FITZGERALD",
                "time": "16:16",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/16/a2/75/16a27533-9fc4-843b-c8d3-d81a377a2395/16UMGIM78399.rgb.jpg/300x300bb.jpg"
        },
        {
                "title": "EINAI XRISTOUGENNA…GIAFTO",
                "artist": "GIORGOS KAKOSAIOS",
                "time": "16:13",
                "image": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/04/55/9f/04559f08-0a8f-8c86-59ab-4aaffb91e9cb/cover.jpg/300x300bb.jpg"
        }
]
  
  
  
},
  initialHistory: [
    {
        "title": "ΜΕ ΛΙΓΑ ΛΟΓΙΑ",
        "artist": "ΝΙΚΟΣ ΟΙΚΟΝΟΜΟΠΟΥΛΟΣ",
        "time": "15:41",
        "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76633.jpg"
    },
    {
        "title": "ΑΣΕ ΜΕ ΝΑ ΣΕ ΠΡΟΣΕΧΩ",
        "artist": "ΓΙΩΡΓΟΣ ΣΑΜΠΑΝΗΣ",
        "time": "15:37",
        "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_75885.jpg"
    },
    {
        "title": "ΕΡΩΤΑΣ ΜΙΚΡΟΣ",
        "artist": "ΠΕΓΚΥ ΖΗΝΑ",
        "time": "15:33",
        "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76701.jpg"
    },
    {
        "title": "ΣΑΒΒΑΤΟ",
        "artist": "ΓΙΩΡΓΟΣ ΜΑΖΩΝΑΚΗΣ",
        "time": "15:29",
        "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_41938.jpg"
    },
    {
        "title": "ΠΑΓΚΟΣΜΙΑ ΜΕΡΑ ΤΟΥ ΨΕΥΤΗ",
        "artist": "ΚΑΤΕΡΙΝΑ ΛΙΟΛΙΟΥ",
        "time": "15:26",
        "image": "https://greca994.gr/playlist/AlbumsCache/jzSong_76686.jpg"
    }
],
  weeklySchedule: {
    weekdays: [
      {
        id: "after-dark-weekdays",
        time: "00:00 - 06:00",
        startHour: 0,
        startMin: 0,
        endHour: 6,
        endMin: 0,
        title: "Greca After Dark",
        presenter: "Εξειδικευμένο Πρόγραμμα • Ερωτικά & Λαϊκά",
        tag: "AFTER DARK",
        image: "assets/shows/greca after dark.jpg",
        paragraphs: [
          "Η νύχτα στον Greca 99,4 αποκτά τη δική της ξεχωριστή υπογραφή.",
          "Κάθε βράδυ μετά τα μεσάνυχτα, η μουσική βαθαίνει: αυθεντικό λαϊκό συναίσθημα, διαχρονικές ερωτικές επιτυχίες και ξεχωριστά τραγούδια σε ένα εξειδικευμένο πρόγραμμα φτιαγμένο αποκλειστικά για τους ξενύχτηδες και τις διαδρομές της νύχτας.",
          "Greca After Dark – το ραδιόφωνο της πόλης, αλλιώς."
        ]
      },
      {
        id: "city-morning-weekdays",
        time: "06:00 - 08:00",
        startHour: 6,
        startMin: 0,
        endHour: 8,
        endMin: 0,
        title: "Η Καλύτερη Μουσική Της Πόλης",
        presenter: "Greca Non-Stop",
        tag: "NON STOP MUSIC",
        image: "assets/shows/nyxta.jpg",
        paragraphs: [
          "Όλες οι No1 ελληνικές επιτυχίες, τα τραγούδια που αγαπάτε και οι μεγαλύτερες ραδιοφωνικές κυκλοφορίες, παίζουν εδώ.",
          "Από το πρωί μέχρι το βράδυ, οι πιο αγαπημένοι καλλιτέχνες και τα No1 hits της ελληνικής δισκογραφίας.",
          "Συντονιστείτε στον Greca 99,4 - Η καλύτερη μουσική της πόλης!"
        ]
      },
      {
        id: "number-one-weekdays",
        time: "08:00 - 10:00",
        startHour: 8,
        startMin: 0,
        endHour: 10,
        endMin: 0,
        title: "Number One Radio Show",
        presenter: "Λάμπρος Κωνσταντάρας",
        tag: "GOSSIP & HITS",
        image: "assets/shows/konstantaras-kathimerina komeno.jpg",
        paragraphs: [
          "Δευτέρα με Παρασκευή 08:00-10:00 στον Greca 99,4, ο Λάμπρος Κωνσταντάρας!",
          "Θέλετε να ξέρετε όσα συμβαίνουν κάθε μέρα ; Στην κανονική ζωή, αλλά και στον κόσμο του lifestyle, της τηλεόρασης, του κουτσομπολιού ;",
          "Θέλετε να γελάμε κάθε μέρα μαζί ;",
          "Να ακούμε τα πιο αγαπημένα τραγούδια, καινούργια και παλιά ;",
          "Να παίζουμε και να ανταλλάσσουμε μηνύματα, καλημέρες ;",
          "Τότε σας προτείνουμε να ακούτε κάθε μέρα “Number One Radio Show” με τον Λάμπρο Κωνσταντάρα. Συχνά-πυκνά μαζί τους και πολλοί αγαπημένοι φίλοι τους, που τους ξέρετε και τους αγαπάτε.",
          "Συντονιστείτε καθημερινές 08:00 με 10:00!"
        ]
      },
      {
        id: "city-all-day-weekdays",
        time: "10:00 - 00:00",
        startHour: 10,
        startMin: 0,
        endHour: 24,
        endMin: 0,
        title: "Η Καλύτερη Μουσική Της Πόλης",
        presenter: "Greca Non-Stop",
        tag: "NON STOP MUSIC",
        image: "assets/shows/nyxta.jpg",
        paragraphs: [
          "Όλες οι No1 ελληνικές επιτυχίες, τα τραγούδια που αγαπάτε και οι μεγαλύτερες ραδιοφωνικές κυκλοφορίες, παίζουν εδώ.",
          "Από το πρωί μέχρι το βράδυ, οι πιο αγαπημένοι καλλιτέχνες και τα No1 hits της ελληνικής δισκογραφίας.",
          "Συντονιστείτε στον Greca 99,4 - Η καλύτερη μουσική της πόλης!"
        ]
      }
    ],
    weekend: [
      {
        id: "after-dark-weekend-early",
        time: "00:00 - 06:00",
        startHour: 0,
        startMin: 0,
        endHour: 6,
        endMin: 0,
        title: "Greca After Dark",
        presenter: "Εξειδικευμένο Πρόγραμμα • Ερωτικά & Λαϊκά",
        tag: "AFTER DARK",
        image: "assets/shows/greca after dark.jpg",
        paragraphs: [
          "Η νύχτα στον Greca 99,4 αποκτά τη δική της ξεχωριστή υπογραφή.",
          "Κάθε βράδυ μετά τα μεσάνυχτα, η μουσική βαθαίνει: αυθεντικό λαϊκό συναίσθημα, διαχρονικές ερωτικές επιτυχίες και ξεχωριστά τραγούδια σε ένα εξειδικευμένο πρόγραμμα φτιαγμένο αποκλειστικά για τους ξενύχτηδες και τις διαδρομές της νύχτας.",
          "Greca After Dark – το ραδιόφωνο της πόλης, αλλιώς."
        ]
      },
      {
        id: "city-weekend",
        time: "06:00 - 22:00",
        startHour: 6,
        startMin: 0,
        endHour: 22,
        endMin: 0,
        title: "Η Καλύτερη Μουσική Της Πόλης",
        presenter: "Greca Non-Stop",
        tag: "WEEKEND HITS",
        image: "assets/shows/nyxta.jpg",
        paragraphs: [
          "Όλες οι No1 ελληνικές επιτυχίες, τα τραγούδια που αγαπάτε και οι μεγαλύτερες ραδιοφωνικές κυκλοφορίες, παίζουν εδώ.",
          "Από το πρωί μέχρι το βράδυ, οι πιο αγαπημένοι καλλιτέχνες και τα No1 hits της ελληνικής δισκογραφίας.",
          "Συντονιστείτε στον Greca 99,4 - Η καλύτερη μουσική της πόλης!"
        ]
      },
      {
        id: "after-dark-weekend-late",
        time: "22:00 - 00:00",
        startHour: 22,
        startMin: 0,
        endHour: 24,
        endMin: 0,
        title: "Greca After Dark",
        presenter: "Εξειδικευμένο Πρόγραμμα • Ερωτικά & Λαϊκά",
        tag: "AFTER DARK",
        image: "assets/shows/greca after dark.jpg",
        paragraphs: [
          "Η νύχτα στον Greca 99,4 αποκτά τη δική της ξεχωριστή υπογραφή.",
          "Κάθε βράδυ μετά τα μεσάνυχτα, η μουσική βαθαίνει: αυθεντικό λαϊκό συναίσθημα, διαχρονικές ερωτικές επιτυχίες και ξεχωριστά τραγούδια σε ένα εξειδικευμένο πρόγραμμα φτιαγμένο αποκλειστικά για τους ξενύχτηδες και τις διαδρομές της νύχτας.",
          "Greca After Dark – το ραδιόφωνο της πόλης, αλλιώς."
        ]
      }
    ]
  },
  articles: [
    {
      id: 1,
      title: "Κωνσταντίνος Αργυρός: Το νέο smash hit «Ρεύμα» σαρώνει τα charts",
      category: "ΜΟΥΣΙΚΑ ΝΕΑ",
      date: "23/10/2026",
      image: "https://greca994.gr/wp-content/uploads/2026/10/revma-argyros.jpg",
      summary: "Το νέο τραγούδι του Κωνσταντίνου Αργυρού παίζει δυνατά στον Greca FM 99,4 και βρίσκεται ήδη στην κορυφή του airplay.",
      link: "https://greca994.gr"
    },
    {
      id: 2,
      title: "Μελίνα Ασλανίδου: «Χειροκροτήματα» στη νέα της κυκλοφορία",
      category: "ΜΟΥΣΙΚΑ ΝΕΑ",
      date: "21/10/2026",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      summary: "Μια μοναδική δυναμική μπαλάντα που κέρδισε αμέσως τις καρδιές των ακροατών του Greca FM 99,4.",
      link: "https://greca994.gr"
    },
    {
      id: 3,
      title: "Γιώργος Κακοσαίος: «Από Συνήθεια» το νέο single που ξεχωρίζει",
      category: "ΜΟΥΣΙΚΑ ΝΕΑ",
      categories: [3],
      date: "19/10/2026",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      summary: "Ο αγαπημένος καλλιτέχνης επιστρέφει με ένα δυνατό τραγούδι που παίζει στον Greca FM 99,4.",
      link: "https://greca994.gr"
    },
    {
      id: 4,
      title: "REC – Έλα «Πρώτη Μετάδοση» αποκλειστικά στον Greca FM 99,4",
      category: "ΠΡΩΤΗ ΜΕΤΑΔΟΣΗ",
      categories: [89],
      date: "14/05/2026",
      image: "https://greca994.gr/wp-content/uploads/2026/05/REC-ELA-COVER-GRECA.jpg",
      summary: "Το νέο smash hit των REC σε πανελλαδική πρώτη ραδιοφωνική μετάδοση αποκλειστικά στον Greca FM 99,4!",
      link: "https://greca994.gr/rec-ela-proti-metadosi/"
    },
    {
      id: 5,
      title: "Πάολα – Νάρκισσος: Νέα Πρώτη Μετάδοση στον Greca FM 99,4",
      category: "ΠΡΩΤΗ ΜΕΤΑΔΟΣΗ",
      categories: [89],
      date: "06/11/2025",
      image: "https://greca994.gr/wp-content/uploads/2025/11/Πάολα-Νάρκισσος-GRECA.jpg",
      summary: "Η εκρηκτική Πάολα επιστρέφει δυναμικά με νέα επιτυχία σε αποκλειστική πρώτη μετάδοση.",
      link: "https://greca994.gr"
    }
  ],
  top30: [
  {
    "rank": 1,
    "title": "ΕΙΠΕΣ",
    "artist": "ΘΟΔΩΡΗΣ ΦΕΡΡΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-371-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d3/52/71/d352710f-86c6-5f59-f37f-c36e06da78a9/mzaf_5418281700735639386.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/eipes/1856735594?i=1856735598&uo=4"
  },
  {
    "rank": 2,
    "title": "ΚΑΝΤΑΔΑ",
    "artist": "APON",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-430-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fc/8d/74/fc8d74f1-2bb8-5c11-8462-7c901a09e578/mzaf_17340023454285976.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/kantada/6768307757?i=6768308098&uo=4"
  },
  {
    "rank": 3,
    "title": "ΕΝΟΧΟ ΚΟΡΜΙ",
    "artist": "ΝΙΚΟΣ ΟΙΚΟΝΟΜΟΠΟΥΛΟΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-451-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cb/b2/f9/cbb2f9a6-80b1-60a2-1264-6a0d38d59aa4/mzaf_4861515035300504374.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/enoho-kormi/6784236775?i=6784236777&uo=4"
  },
  {
    "rank": 4,
    "title": "ΑΙΓΑΙΟ",
    "artist": "ΑΝΝΑ ΒΙΣΣΗ",
    "image": "https://greca994.gr/wp-content/uploads/2017/01/1000x1000bb-48-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/98/78/b0/9878b054-58c5-5e70-eba6-b54c17f23ca5/mzaf_8758236572015828087.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/aigaio/1891760550?i=1891760552&uo=4"
  },
  {
    "rank": 5,
    "title": "ΦΟΡΤΗΓΟ",
    "artist": "ΝΑΤΑΣΑ ΘΕΟΔΩΡΙΔΟΥ",
    "image": "https://greca994.gr/wp-content/uploads/2017/01/1000x1000bb-47-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/64/e9/d5/64e9d5a4-ef33-32f8-b17f-ec265bc81e8e/mzaf_460040561760083431.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/fortigo/1892027606?i=1892027607&uo=4"
  },
  {
    "rank": 6,
    "title": "ΔΕΥΤΕΡΑ",
    "artist": "ΑΝΤΩΝΗΣ ΡΕΜΟΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-367-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/93/bc/f0/93bcf0bd-85b3-d03f-88da-f7e56644e345/mzaf_4826288102713597880.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/deutera/1853079078?i=1853079079&uo=4"
  },
  {
    "rank": 7,
    "title": "ΛΑΘΟΣ ΣΟΥ",
    "artist": "ΗΛΙΑΣ ΒΡΕΤΤΟΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-449-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/fe/6a/12fe6aea-5442-260f-6b72-79f77c396cd7/mzaf_4571428203635541203.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/lathos-sou/6768820347?i=6768820349&uo=4"
  },
  {
    "rank": 8,
    "title": "ΟΤΙ ΠΙΟ ΟΜΟΡΦΟ",
    "artist": "ΧΡΗΣΤΟΣ ΜΕΝΙΔΙΑΤΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2017/01/jzSong_76675.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d1/e2/7a/d1e27a1c-d3a1-e805-4ed8-b4a6bbad5a2b/mzaf_7253595429135901158.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/o-ti-pio-omorfo/6776439531?i=6776439805&uo=4"
  },
  {
    "rank": 9,
    "title": "ΤΙ ΚΑΝΕΙΣ",
    "artist": "NINO FEAT JOSEPHINE",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-407-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/52/80/9b/52809bdf-b13d-296f-ffc6-b77bd801bab5/mzaf_13958381753131177372.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/ti-kaneis/1884664580?i=1884664581&uo=4"
  },
  {
    "rank": 10,
    "title": "ΤΙ ΘΕΛΩ ΕΓΩ ΜΕ ΣΕΝΑ",
    "artist": "ΓΙΩΡΓΟΣ ΣΑΜΠΑΝΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-431-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1d/0c/77/1d0c7795-77ea-37d2-fca2-99e902d71998/mzaf_10272379949585460444.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/ti-thelo-ego-me-sena/6773495277?i=6773495411&uo=4"
  },
  {
    "rank": 11,
    "title": "ΣΠΑΣΤΕ ΤΑ",
    "artist": "ΑΝΑΣΤΑΣΙΑ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-442-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7e/c8/01/7ec8010e-881f-0b0e-1520-63291c84a3eb/mzaf_13599799003309826283.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/spaste-ta/6768264999?i=6768265001&uo=4"
  },
  {
    "rank": 12,
    "title": "ΣΤΑ ΚΑΛΥΤΕΡΑ ΠΟΥ ΕΛΚΟΝΤΑΙ",
    "artist": "ΙΟΥΛΙΑ ΚΑΛΛΙΜΑΝΗ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-450-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/94/18/a9/9418a9a2-acd9-de2b-6122-e5d8f12cf1ea/mzaf_7412608707465416972.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/sta-kalitera-pou-elkontai-agapate-katallilous/6778294269?i=6778294570&uo=4"
  },
  {
    "rank": 13,
    "title": "ΥΠΟΣΥΝΕΙΔΗΤΟ",
    "artist": "ΚΑΙΤΗ ΓΑΡΜΠΗ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-432-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/46/9d/25/469d25d6-49c3-9480-b17a-eda945578190/mzaf_8980026880012636024.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/yposinidito/1895983263?i=6765533491&uo=4"
  },
  {
    "rank": 14,
    "title": "ΠΟΙΟΣ ΝΑ ΣΟΥ ΤΟ ΠΕΙ",
    "artist": "TOQUEL FEAT LILA",
    "image": "https://greca994.gr/wp-content/uploads/2025/04/Toquel-Lila-poios-na-sou-to-pei-300x300-1.jpg",
    "audio": "",
    "buyLink": ""
  },
  {
    "rank": 15,
    "title": "ΠΑΓΚΟΣΜΙΟ ΦΑΙΝΟΜΕΝΟ",
    "artist": "ΠΕΤΡΟΣ ΙΑΚΩΒΙΔΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-466-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/71/06/00/710600c6-8d9a-cc93-d68d-f3098cdb6665/mzaf_1477245341370206817.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/pagkosmio-fainomeno/6795835277?i=6795835283&uo=4"
  },
  {
    "rank": 16,
    "title": "ΠΑΓΚΟΣΜΙΑ ΜΕΡΑ ΤΟΥ ΨΕΥΤΗ",
    "artist": "ΚΑΤΕΡΙΝΑ ΛΙΟΛΙΟΥ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-467-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/26/90/15/26901507-95c5-2abf-e67f-d3a53d0e0591/mzaf_4993413731719708124.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/pagkosmia-mera-tou-psefti/6807020113?i=6807020124&uo=4"
  },
  {
    "rank": 17,
    "title": "ΥΠΕΥΘΥΝΟΙ ΕΙΜΑΣΤΕ 2026",
    "artist": "ΣΤΕΛΛΑ ΚΑΛΛΗ",
    "image": "https://greca994.gr/wp-content/uploads/2025/04/stella-kallh-ypefthynoi-eimaste-2026-version.jpg",
    "audio": "",
    "buyLink": ""
  },
  {
    "rank": 18,
    "title": "ΑΥΤΑ ΤΑ ΧΕΙΛΙΑ",
    "artist": "ΝΙΚΟΣ ΑΠΕΡΓΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2017/01/jzSong_76506.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8d/65/f8/8d65f8fe-5359-5cd6-e75a-0e0d0e5ffa21/mzaf_4543701209976656039.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/auta-ta-xeilia-unplugged/1807167005?i=1807167340&uo=4"
  },
  {
    "rank": 19,
    "title": "ΣΗΜΑΔΙ",
    "artist": "ΜΙΧΑΛΗΣ ΚΑΡΑΓΚΟΥΝΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-469-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/20/70/f4/2070f43e-2af9-6284-6703-4f368bfb7365/mzaf_16133901854177097448.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/simadi/6787990692?i=6787990695&uo=4"
  },
  {
    "rank": 20,
    "title": "ΟΧΙ ΓΙΑΤΙ",
    "artist": "ΑΝΝΑ ΒΙΣΣΗ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-480-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e8/77/b1/e877b16c-a57a-b946-79de-d489705584cd/mzaf_8256973841090610328.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/oxi-giati/6806353145?i=6806353149&uo=4"
  },
  {
    "rank": 21,
    "title": "ΑΝΟΙΧΤΗ ΑΚΡΟΑΣΗ",
    "artist": "ΠΑΝΟΣ ΚΙΑΜΟΣ",
    "image": "https://greca994.gr/wp-content/uploads/2017/01/jzSong_76691.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d6/df/4a/d6df4a22-5957-16ce-4d31-ec2b0a4f5aad/mzaf_9312446060757760607.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/anoixti-akroasi/6814659634?i=6814659899&uo=4"
  },
  {
    "rank": 22,
    "title": "ΑΠΟΦΑΣΗ ΣΟΥ",
    "artist": "ΔΗΜΟΣ ΑΝΑΣΤΑΣΙΑΔΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-468-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8c/9d/bf/8c9dbfb7-0db0-c3c1-ec54-abfc14d16ec4/mzaf_10431838711334784556.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/apofasi-sou/6776297181?i=6776297183&uo=4"
  },
  {
    "rank": 23,
    "title": "ΕΣΕΝΑ Η ΤΙΠΟΤΑ",
    "artist": "ΣΤΕΛΙΟΣ ΡΟΚΚΟΣ",
    "image": "https://greca994.gr/wp-content/uploads/2017/01/jzSong_76695.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b4/7d/6f/b47d6f9b-90d8-965f-e132-f024f91b7684/mzaf_4610665944763616096.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/esena-i-tipota/6811888916?i=6811888920&uo=4"
  },
  {
    "rank": 24,
    "title": "ΟΛΑ ΜΑΓΙΚΑ",
    "artist": "ΜΙΧΑΛΗΣ ΧΑΤΖΗΓΙΑΝΝΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-463-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ac/f9/65/acf9654a-0974-7c78-d6c1-fde67d4cccbb/mzaf_11670368253647202834.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/ola-magika/6786265166?i=6786265167&uo=4"
  },
  {
    "rank": 25,
    "title": "ΕΡΩΤΑΣ ΜΙΚΡΟΣ",
    "artist": "ΠΕΓΚΥ ΖΗΝΑ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-481-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a2/87/fb/a287fb67-c47a-cae7-b9f3-834a57145f5c/mzaf_10537601290176851642.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/erotas-mikros/6815369564?i=6815369566&uo=4"
  },
  {
    "rank": 26,
    "title": "ΛΟΓΑΡΙΑΣΜΟΣ",
    "artist": "ΚΑΤΕΡΙΝΑ ΛΙΟΛΙΟΥ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-380-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0e/07/0d/0e070df1-5309-069e-ef2a-4c4c5be09ab6/mzaf_15108641128957284179.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/logariasmos/1869471945?i=1869472168&uo=4"
  },
  {
    "rank": 27,
    "title": "ΤΙ ΣΟΥ ΧΡΩΣΤΑΩ",
    "artist": "ΕΛΛΗ ΚΟΚΚΙΝΟΥ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-433-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c1/99/21/c19921f3-0e44-5e3b-0d45-c3c76ffe03cd/mzaf_5594351960543072906.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/ti-sou-hrostao/6773494425?i=6773494428&uo=4"
  },
  {
    "rank": 28,
    "title": "ΟΝΕΙΡΟ ΘΑ ΝΑΙ ΞΑΝΑ",
    "artist": "ΘΟΔΩΡΗΣ ΦΕΡΡΗΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-312-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1c/87/cb/1c87cb64-d9ba-a175-fe23-23890a7214a1/mzaf_16016248037158352181.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/oneiro-tha-nai-ksana-kounia/1828501013?i=1828501015&uo=4"
  },
  {
    "rank": 29,
    "title": "ΚΑΙ ΕΙΣ ΑΝΩΤΕΡΑ",
    "artist": "ΓΙΩΡΓΟΣ ΚΑΚΟΣΑΙΟΣ",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-422-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2c/1a/6c/2c1a6c26-a81a-f108-d8f7-84178bffcab0/mzaf_507091975980073984.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/kai-eis-anotera/6766519132?i=6766519155&uo=4"
  },
  {
    "rank": 30,
    "title": "ΙΣΩΣ ΑΥΡΙΟ",
    "artist": "ΝΙΚΟΣ ΑΠΕΡΓΗΣ FEAT DAPHNE LAWRENCE",
    "image": "https://greca994.gr/wp-content/uploads/2020/06/1000x1000bb-482-370x370.jpg",
    "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8a/52/11/8a521114-752b-c9b1-1a71-b46e94810322/mzaf_15817607033467175345.plus.aac.p.m4a",
    "buyLink": "https://music.apple.com/us/album/isos-avrio/6766361402?i=6766361405&uo=4"
  }
]
};

if (typeof window !== "undefined") {
  window.APP_DATA = APP_DATA;
}
