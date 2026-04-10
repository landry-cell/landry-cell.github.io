// =============================================
// IDENTITÉ DE L'ÉGLISE
// =============================================
const CHURCH = {
  name: "CER Ouezzinville Nord",
  temple: "Temple Philadelphie",
  full: "CER Ouezzinville Nord — Temple Philadelphie",
  short: "Philadelphie"
};

// =============================================
// CONTENU MULTILINGUE POUR LA PAGE "À PROPOS"
// =============================================
const aboutContent = {
  fr: `À propos de CER Ouezzinville Nord Temple Philadelphie\n\nCER Ouezzinville Nord Temple Philadelphie est une communauté chrétienne évangélique établie au Burkina Faso, dans la ville de Bobo-Dioulasso, précisément à 500 mètres du CEMA de Dafra.\n\nFondée en 2020, l'église a été implantée avec foi et dévouement par le regretté Pasteur Sanou, serviteur de Dieu engagé, qui a rejoint le Seigneur après avoir posé les fondements spirituels de cette œuvre. Le ministère est aujourd'hui poursuivi sous la conduite du Pasteur Tchonda Moïse, dans la continuité de la vision reçue et avec un profond attachement aux Saintes Écritures.\n\nNotre Vision\n\nÉlever une génération profondément enracinée dans la Parole de Dieu, transformée par la puissance du Saint-Esprit et engagée dans l'avancement du Royaume.\n\nNotre Mission\n\nAnnoncer fidèlement l'Évangile de Jésus-Christ\nFormer des disciples matures et responsables\nConsolider les familles dans les principes bibliques\nServir la communauté avec amour, intégrité et compassion\n\nNos Valeurs\n\nLa centralité de la Parole de Dieu\nLa prière et la sanctification\nL'unité fraternelle\nL'intégrité morale\nL'excellence dans le service`,
  en: `About CER Ouezzinville Nord Temple Philadelphie\n\nCER Ouezzinville Nord Temple Philadelphie is an evangelical Christian church located in Burkina Faso, in the city of Bobo-Dioulasso, approximately 500 meters from CEMA Dafra.\n\nEstablished in 2020, the church was founded through faith and dedication by the late Pastor Sanou.\n\nOur Vision\n\nTo raise a generation firmly grounded in the Word of God.\n\nOur Mission\n\nTo faithfully proclaim the Gospel of Jesus Christ\nTo train mature and responsible disciples\nTo strengthen families through biblical principles\nTo serve the community with love, integrity, and compassion`,
  dioula: `An ka CER Ouezzinville Nord Temple Philadelphie la\n\nCER Ouezzinville Nord Temple Philadelphie ye eglizi kɛ Burkina Faso, Bobo-Dioulasso la.`,
  moore: `À propos – CER Ouezzinville Nord Temple Philadelphie\n\nCER Ouezzinville Nord Temple Philadelphie yaa egliz kristaana Burkina Faso, Bobo-Dioulasso.`
};

// =============================================
// MÉDITATIONS (730+)
// =============================================
const baseMeditations = [
  { text:"Je connais tes œuvres. Voici, j'ai mis devant toi une porte ouverte, que personne ne peut fermer.", ref:"Apocalypse 3:8" },
  { text:"Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.", ref:"Jean 3:16" },
  { text:"L'Éternel est mon berger : je ne manquerai de rien.", ref:"Psaume 23:1" },
  { text:"Ne crains point, car je suis avec toi ; ne sois point effrayé, car je suis ton Dieu.", ref:"Ésaïe 41:10" },
  { text:"Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", ref:"Matthieu 11:28" },
  { text:"Je puis tout par celui qui me fortifie.", ref:"Philippiens 4:13" },
  { text:"Confie-toi en l'Éternel de tout ton cœur.", ref:"Proverbes 3:5" },
  { text:"Car je connais les projets que j'ai formés sur vous, projets de paix et non de malheur.", ref:"Jérémie 29:11" },
  { text:"Dieu est notre refuge et notre force, un secours qui ne manque jamais.", ref:"Psaume 46:1" },
  { text:"Soyez toujours joyeux. Priez sans cesse. Rendez grâces en toutes choses.", ref:"1 Thess. 5:16-18" },
  { text:"Jésus-Christ est le même hier, aujourd'hui, et éternellement.", ref:"Hébreux 13:8" },
  { text:"Aimez-vous les uns les autres ; comme je vous ai aimés.", ref:"Jean 15:12" },
  { text:"Tout ce que vous demanderez en mon nom, je le ferai.", ref:"Jean 14:13" },
  { text:"Si Dieu est pour nous, qui sera contre nous ?", ref:"Romains 8:31" },
  { text:"Je vous laisse la paix, je vous donne ma paix.", ref:"Jean 14:27" },
  { text:"Cherchez premièrement le royaume et la justice de Dieu.", ref:"Matthieu 6:33" },
  { text:"Je suis le chemin, la vérité, et la vie.", ref:"Jean 14:6" },
  { text:"Vous êtes la lumière du monde.", ref:"Matthieu 5:14" },
  { text:"La foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.", ref:"Hébreux 11:1" },
  { text:"Nous savons que toutes choses concourent au bien de ceux qui aiment Dieu.", ref:"Romains 8:28" },
  { text:"Dieu est amour, et celui qui demeure dans l'amour demeure en Dieu, et Dieu demeure en lui.", ref:"1 Jean 4:16" },
  { text:"Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu.", ref:"Philippiens 4:6" },
  { text:"Car la parole de Dieu est vivante et efficace, plus tranchante qu'une épée quelconque à deux tranchants.", ref:"Hébreux 4:12" },
  { text:"Le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bienveillance, la foi, la douceur, la maîtrise de soi.", ref:"Galates 5:22-23" },
  { text:"Si quelqu'un est en Christ, il est une nouvelle créature.", ref:"2 Corinthiens 5:17" },
  { text:"Le nom de l'Éternel est une tour forte ; le juste s'y réfugie et se trouve en sûreté.", ref:"Proverbes 18:10" },
  { text:"Béni soit l'homme qui se confie en l'Éternel.", ref:"Jérémie 17:7" },
  { text:"Demeurez en moi, et je demeurerai en vous.", ref:"Jean 15:4" },
  { text:"Le Seigneur est proche de tous ceux qui l'invoquent.", ref:"Psaume 145:18" },
  { text:"Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres.", ref:"Éphésiens 2:10" }
];

// =============================================
// TRADUCTIONS
// =============================================
const T = {
  fr: {
    navHome:"Accueil", navBible:"Bible", navLive:"Live", navSermons:"Prédica.", navGallery:"Galerie", navMeditation:"Méditer",
    navAbout:"À propos", navContact:"Contact", navPrograms:"Programmes", navDashboard:"Dashboard",
    templePhiladelphie:"Temple Philadelphie", philadelphiaVerse:"« Je connais tes œuvres. Voici, j'ai mis devant toi une porte ouverte... »",
    onlineNow:"en ligne", statLives:"Lives", statMembers:"Membres", statSermons:"Prédications", statMeditations:"Méditations",
    quickActions:"Actions rapides", readBible:"Bible", meditate:"Méditer", watchLive:"Lives", watchSermons:"Prédica.", viewGallery:"Galerie",
    quickMeditation:"Méditation rapide", upcomingEvents:"Prochains cultes", noEvents:"Aucun culte programmé", bibleTitle:"La Bible",
    book:"Livre", chapter:"Chapitre", search:"Recherche", listen:"Écouter", noFavorites:"Aucun favori", liveTitle:"Live – Enregistrement",
    createLive:"Démarrer un live", currentLives:"En cours", scheduledLives:"Programmés", calendar:"Calendrier", noLives:"Aucun live",
    noScheduled:"Aucun programmé", leave:"Quitter", participants:"participants", reactions:"Réactions", liveCamera:"Caméra",
    enableCamera:"Activer", disableCamera:"Désactiver", livePhotos:"Photos du Live", chat:"Chat", sermonsTitle:"Prédications",
    noSermons:"Aucune prédication", galleryTitle:"Galerie", noPhotos:"Aucune photo", create:"Créer", cancel:"Annuler",
    copiedVerse:"Copié !", addedFavorite:"Favori ajouté !", removedFavorite:"Favori retiré", photoSaved:"Photo sauvegardée !",
    liveCreated:"Live créé !", sermonAdded:"Prédication ajoutée !", uploadComplete:"Upload terminé !", error:"Erreur",
    spamWarning:"Patientez...", joinLive:"Rejoindre", endLive:"Terminer", days:"j", hours:"h", minutes:"min", seconds:"s",
    start:"Démarrer", pause:"Pause", stop:"Arrêter", meditationTitle:"🧘 Méditation & Prière", meditationSubtitle:"Trouvez la paix dans Sa présence",
    meditateVerse:"Méditer ce verset", totalMinutes:"min. total", sessions:"sessions", streak:"jours", choosePractice:"Pratique",
    breathingMode:"Respiration", breathingDesc:"Inspirez, expirez", prayerMode:"Prière", prayerDesc:"Recueillement",
    scriptureMode:"Lectio Divina", scriptureDesc:"Écritures", gratitudeMode:"Gratitude", gratitudeDesc:"Louange", duration:"Durée",
    ambientSound:"Ambiance", silence:"Silence", rain:"Pluie", ocean:"Océan", forest:"Forêt", fireplace:"Feu", birds:"Oiseaux",
    readyStart:"Prêt à commencer", pressStart:"Appuyez<br>Démarrer", inhale:"Inspirez...", holdBreath:"Retenez...", exhale:"Expirez...",
    journal:"Journal", saveEntry:"Sauvegarder", medHistory:"Historique", medComplete:"Méditation terminée", noMedHistory:"Aucune session",
    entrySaved:"Sauvegardé !", lectioDivina:"Lectio Divina", lectioDesc:"Lisez lentement", gratitudeTitle:"Gratitude",
    gratitudeInst:"3 sujets de reconnaissance",
    aboutTitle:"À propos de nous", contactTitle:"Nous contacter",
    programsTitle:"Programme des cultes",
    sundayService:"Culte du dimanche", sundayDesc:"Adoration, enseignement biblique, communion fraternelle",
    wednesdayPrayer:"Prière du mercredi", wednesdayDesc:"Intercession, louange, méditation de la Parole",
    fridayPrayer:"Veillée de prière", fridayDesc:"Louange intense, prière pour les besoins, combat spirituel",
    serviceTimes:"Horaires des cultes", sunday:"Dimanche", wednesday:"Mercredi", friday:"Vendredi",
    announcementsTitle:"Informations & Annonces", chatTitle:"Chat Communautaire"
  },
  en: {
    navHome:"Home", navBible:"Bible", navLive:"Live", navSermons:"Sermons", navGallery:"Gallery", navMeditation:"Meditate",
    navAbout:"About", navContact:"Contact", navPrograms:"Programs", navDashboard:"Dashboard",
    templePhiladelphie:"Temple Philadelphia", philadelphiaVerse:'"I know your works..."', onlineNow:"online", statLives:"Lives",
    statMembers:"Members", statSermons:"Sermons", statMeditations:"Meditations", quickActions:"Quick Actions", readBible:"Bible",
    meditate:"Meditate", watchLive:"Lives", watchSermons:"Sermons", viewGallery:"Gallery", quickMeditation:"Quick meditation",
    upcomingEvents:"Upcoming Services", noEvents:"No events", bibleTitle:"The Bible", book:"Book", chapter:"Chapter", search:"Search",
    listen:"Listen", noFavorites:"No favorites", liveTitle:"Live Recording", createLive:"Start Live", noLives:"No live",
    noScheduled:"None scheduled", leave:"Leave", participants:"participants", reactions:"Reactions", liveCamera:"Camera",
    enableCamera:"Enable", disableCamera:"Disable", livePhotos:"Live Photos", chat:"Chat", sermonsTitle:"Sermons", noSermons:"No sermons",
    galleryTitle:"Gallery", noPhotos:"No photos", create:"Create", cancel:"Cancel", copiedVerse:"Copied!", addedFavorite:"Added!",
    removedFavorite:"Removed", photoSaved:"Photo saved!", liveCreated:"Live created!", sermonAdded:"Sermon added!", uploadComplete:"Upload done!",
    error:"Error", spamWarning:"Wait...", joinLive:"Join", endLive:"End", days:"d", hours:"h", minutes:"min", seconds:"s",
    start:"Start", pause:"Pause", stop:"Stop", meditationTitle:"🧘 Meditation & Prayer", meditationSubtitle:"Find peace in His presence",
    meditateVerse:"Meditate this verse", totalMinutes:"total min", sessions:"sessions", streak:"days", choosePractice:"Practice",
    breathingMode:"Breathing", breathingDesc:"Breathe in rhythm", prayerMode:"Prayer", prayerDesc:"Quiet time", scriptureMode:"Lectio Divina",
    scriptureDesc:"Scriptures", gratitudeMode:"Gratitude", gratitudeDesc:"Praise", duration:"Duration", ambientSound:"Ambient",
    silence:"Silence", rain:"Rain", ocean:"Ocean", forest:"Forest", fireplace:"Fire", birds:"Birds", readyStart:"Ready",
    pressStart:"Press<br>Start", inhale:"Breathe in...", holdBreath:"Hold...", exhale:"Breathe out...", journal:"Journal",
    saveEntry:"Save", medHistory:"History", medComplete:"Meditation complete", noMedHistory:"No sessions", entrySaved:"Saved!",
    lectioDivina:"Lectio Divina", lectioDesc:"Read slowly", gratitudeTitle:"Gratitude", gratitudeInst:"3 things you're thankful for",
    aboutTitle:"About us", contactTitle:"Contact us",
    programsTitle:"Service Schedule",
    sundayService:"Sunday Service", sundayDesc:"Worship, Bible teaching, fellowship",
    wednesdayPrayer:"Wednesday Prayer", wednesdayDesc:"Intercession, praise, meditation",
    fridayPrayer:"Friday Prayer Vigil", fridayDesc:"Intense praise, prayer needs, spiritual warfare",
    serviceTimes:"Service times", sunday:"Sunday", wednesday:"Wednesday", friday:"Friday",
    announcementsTitle:"News & Announcements", chatTitle:"Community Chat"
  },
  dioula: {
    navHome:"Sofɛ", navBible:"Kitabu", navLive:"Tele", navSermons:"Lasiri", navGallery:"Foto", navMeditation:"Miiri",
    navAbout:"Kɔfɛ", navContact:"Kungnɔngɔ", navPrograms:"Seli waati", navDashboard:"Dashboard",
    templePhiladelphie:"Filadelifiya Bato So", philadelphiaVerse:'"N bɛ i ka baara lɔn..."', onlineNow:"bɛ yen",
    readBible:"Kitabu", meditate:"Miiri", watchLive:"Tele", watchSermons:"Lasiri", viewGallery:"Fotow", quickMeditation:"Miiri kaclɛ",
    noEvents:"Ko si tɛ", bibleTitle:"Kitabu", book:"Gafɛ", chapter:"Kun", search:"Ɲini", listen:"Lamɛ",
    noFavorites:"N fari si tɛ", liveTitle:"Tele", createLive:"Tele damina", noLives:"Tele si tɛ",
    noScheduled:"Ko si tɛ min bɛ na", leave:"Bɔ", participants:"mɔgɔw", reactions:"Yɛlɛma", liveCamera:"Kamera",
    enableCamera:"Kamera damina", disableCamera:"Kamera laban", livePhotos:"Fotow", chat:"Baro", sermonsTitle:"Lasiriw",
    noSermons:"Lasiri si tɛ", galleryTitle:"Fotow", noPhotos:"Foto si tɛ", create:"Daminɛ", cancel:"Mɔn", copiedVerse:"Kopya !",
    addedFavorite:"N fari yɛ!", removedFavorite:"N fari bɔra!", photoSaved:"Foto marala!", liveCreated:"Tele daminɛra!",
    sermonAdded:"Lasiri fara a kan!", uploadComplete:"Banna!", error:"Fili", spamWarning:"Maka...", joinLive:"Don",
    endLive:"Bannya", days:"d", hours:"h", minutes:"mn", seconds:"s", start:"Daminɛ", pause:"Lɔ", stop:"Bannya",
    meditationTitle:"Miiri", meditationSubtitle:"Hɛrɛ sɔrɔ", meditateVerse:"Miiri kun", totalMinutes:"dɔɔnin", sessions:"kɛlen", streak:"don",
    choosePractice:"Kalan", breathingMode:"Fiyɛn", breathingDesc:"Fiyɛn ta, bɔ", prayerMode:"Seli", prayerDesc:"Dɔɔnin",
    scriptureMode:"Gafɛ kalan", scriptureDesc:"Gafɛ", gratitudeMode:"Bato", gratitudeDesc:"Bato", duration:"Waati",
    ambientSound:"Fiyɛn", silence:"Dondoli", rain:"Sanji", ocean:"Baji", forest:"Tugu", fireplace:"Tasuma", birds:"Kɔnɔw",
    readyStart:"Sɛgɛn", pressStart:"Daminɛ", inhale:"Fiyɛn don...", holdBreath:"A mara...", exhale:"Fiyɛn bɔ...",
    journal:"Gafɛ", saveEntry:"Mara", medHistory:"Kɛlen", medComplete:"Miiri banna", noMedHistory:"Miiri si tɛ", entrySaved:"Marala!",
    lectioDivina:"Gafɛ kalan", lectioDesc:"Kalan dɔɔnin dɔɔnin", gratitudeTitle:"Bato", gratitudeInst:"3 ko",
    aboutTitle:"Kɔfɛ", contactTitle:"Kungnɔngɔ",
    programsTitle:"Seli waati",
    sundayService:"Dimanche seli", sundayDesc:"Bato, Gafɛ kalan, dɔɔnin",
    wednesdayPrayer:"Mercredi seli", wednesdayDesc:"Seli, dɔɔnin",
    fridayPrayer:"Vendredi seli", fridayDesc:"Seli, dɔɔnin",
    serviceTimes:"Seli waati", sunday:"Dimanche", wednesday:"Mercredi", friday:"Vendredi",
    announcementsTitle:"Kibaru", chatTitle:"Baro"
  },
  moore: {
    navHome:"Rẽem", navBible:"Biibl", navLive:"Vɩɩr", navSermons:"Paab", navGallery:"Fotos", navMeditation:"Tags",
    navAbout:"Zĩri", navContact:"Gomde", navPrograms:"Tʋʋm wakate", navDashboard:"Dashboard",
    templePhiladelphie:"Filadelifiya Wẽnd Doog", philadelphiaVerse:'"Mam mii fo tʋʋma..."', onlineNow:"be masã",
    readBible:"Biibl", meditate:"Tags", watchLive:"Vɩɩr", watchSermons:"Paab", viewGallery:"Fotos", quickMeditation:"Tags kela",
    noEvents:"Tʋʋm ka be", bibleTitle:"Biibl", book:"Gaf", chapter:"Kãsem", search:"Bao", listen:"Kelm",
    noFavorites:"Nongr ka be", liveTitle:"Vɩɩr", createLive:"Vɩɩr sɩng", noLives:"Vɩɩr ka be",
    noScheduled:"B sẽn na n wa ka be", leave:"Bɑse", participants:"neb", reactions:"Tʋʋm", liveCamera:"Kamera",
    enableCamera:"Kamera sɩng", disableCamera:"Kamera bɑse", livePhotos:"Fotos", chat:"Gomde", sermonsTitle:"Paab",
    noSermons:"Paab ka be", galleryTitle:"Fotos", noPhotos:"Fotos ka be", create:"Sɩng", cancel:"Bɑse", copiedVerse:"Kopa !",
    addedFavorite:"Mam nonga!", removedFavorite:"Bɑse", photoSaved:"Foto bɑse!", liveCreated:"Vɩɩr sɩnga!",
    sermonAdded:"Paab fɑɑr a zugu!", uploadComplete:"Bɑse!", error:"Tʋʋm ka tɑ", spamWarning:"Mɑɑn...", joinLive:"Kẽ",
    endLive:"Bɑse", days:"d", hours:"h", minutes:"mn", seconds:"s", start:"Sɩng", pause:"Lɑɑ", stop:"Bɑse",
    meditationTitle:"Tags", meditationSubtitle:"Laafɩ bɑo", meditateVerse:"Tags goam", totalMinutes:"min", sessions:"sɛɛs", streak:"rɑɑre",
    choosePractice:"Yãa", breathingMode:"Vʋʋsem", breathingDesc:"Vʋʋse, yiis", prayerMode:"Pʋʋs", prayerDesc:"Yõk", scriptureMode:"Gaf kɑrem",
    scriptureDesc:"Gafʋ", gratitudeMode:"Pẽgre", gratitudeDesc:"Pẽgr", duration:"Wakat", ambientSound:"Vʋʋsem",
    silence:"Yõk", rain:"Sɑɑgɑ", ocean:"Mɑɑs", forest:"Wẽoogo", fireplace:"Bugum", birds:"Liiya", readyStart:"Sεk",
    pressStart:"Sɩng", inhale:"Vʋʋse...", holdBreath:"Tõe...", exhale:"Yiis...",
    journal:"Gafʋ", saveEntry:"Bĩng", medHistory:"Kɑren", medComplete:"Tagsgɑ sɑɑmɛ", noMedHistory:"Tags wakat ka be", entrySaved:"Bĩngɑ!",
    lectioDivina:"Gaf kɑrem", lectioDesc:"Kɑrem sεεfɑ", gratitudeTitle:"Pẽgr", gratitudeInst:"Yεl 3",
    aboutTitle:"Tõnd yεla", contactTitle:"Gomde tõnd nengẽ",
    programsTitle:"Tʋʋm wakate",
    sundayService:"Dimanche tʋʋm", sundayDesc:"Wẽnd pẽgre, Gaf karengre",
    wednesdayPrayer:"Mercredi pʋʋsg", wednesdayDesc:"Pʋʋsg, Wẽnd pẽgre",
    fridayPrayer:"Vendredi pʋʋsg", fridayDesc:"Pʋʋsg, tʋʋmd nins",
    serviceTimes:"Tʋʋm wakate", sunday:"Dimanche", wednesday:"Mercredi", friday:"Vendredi",
    announcementsTitle:"Kibaru", chatTitle:"Gomde"
  }
};

// =============================================
// 📖 BIBLE DATA — 66 livres complets
// =============================================

// Noms français des livres
const BIBLE_BOOKS_FR = {
  // Ancien Testament
  Genesis:"Genèse", Exodus:"Exode", Leviticus:"Lévitique", Numbers:"Nombres",
  Deuteronomy:"Deutéronome", Joshua:"Josué", Judges:"Juges", Ruth:"Ruth",
  "1 Samuel":"1 Samuel", "2 Samuel":"2 Samuel", "1 Kings":"1 Rois", "2 Kings":"2 Rois",
  "1 Chronicles":"1 Chroniques", "2 Chronicles":"2 Chroniques", Ezra:"Esdras",
  Nehemiah:"Néhémie", Esther:"Esther", Job:"Job", Psalms:"Psaumes",
  Proverbs:"Proverbes", Ecclesiastes:"Ecclésiaste", "Song of Solomon":"Cantique des Cantiques",
  Isaiah:"Ésaïe", Jeremiah:"Jérémie", Lamentations:"Lamentations",
  Ezekiel:"Ézéchiel", Daniel:"Daniel", Hosea:"Osée", Joel:"Joël",
  Amos:"Amos", Obadiah:"Abdias", Jonah:"Jonas", Micah:"Michée",
  Nahum:"Nahoum", Habakkuk:"Habacuc", Zephaniah:"Sophonie",
  Haggai:"Aggée", Zechariah:"Zacharie", Malachi:"Malachie",
  // Nouveau Testament
  Matthew:"Matthieu", Mark:"Marc", Luke:"Luc", John:"Jean",
  Acts:"Actes", Romans:"Romains", "1 Corinthians":"1 Corinthiens",
  "2 Corinthians":"2 Corinthiens", Galatians:"Galates", Ephesians:"Éphésiens",
  Philippians:"Philippiens", Colossians:"Colossiens",
  "1 Thessalonians":"1 Thessaloniciens", "2 Thessalonians":"2 Thessaloniciens",
  "1 Timothy":"1 Timothée", "2 Timothy":"2 Timothée", Titus:"Tite",
  Philemon:"Philémon", Hebrews:"Hébreux", James:"Jacques",
  "1 Peter":"1 Pierre", "2 Peter":"2 Pierre",
  "1 John":"1 Jean", "2 John":"2 Jean", "3 John":"3 Jean",
  Jude:"Jude", Revelation:"Apocalypse"
};

// Nombre de chapitres par livre (66 livres)
const BC = {
  Genesis:50, Exodus:40, Leviticus:27, Numbers:36, Deuteronomy:34,
  Joshua:24, Judges:21, Ruth:4, "1 Samuel":31, "2 Samuel":24,
  "1 Kings":22, "2 Kings":25, "1 Chronicles":29, "2 Chronicles":36,
  Ezra:10, Nehemiah:13, Esther:10, Job:42, Psalms:150,
  Proverbs:31, Ecclesiastes:12, "Song of Solomon":8,
  Isaiah:66, Jeremiah:52, Lamentations:5, Ezekiel:48, Daniel:12,
  Hosea:14, Joel:3, Amos:9, Obadiah:1, Jonah:4, Micah:7,
  Nahum:3, Habakkuk:3, Zephaniah:3, Haggai:2, Zechariah:14, Malachi:4,
  Matthew:28, Mark:16, Luke:24, John:21, Acts:28,
  Romans:16, "1 Corinthians":16, "2 Corinthians":13,
  Galatians:6, Ephesians:6, Philippians:4, Colossians:4,
  "1 Thessalonians":5, "2 Thessalonians":3,
  "1 Timothy":6, "2 Timothy":4, Titus:3, Philemon:1,
  Hebrews:13, James:5, "1 Peter":5, "2 Peter":3,
  "1 John":5, "2 John":1, "3 John":1, Jude:1, Revelation:22
};

// Groupes de livres pour l'interface
const BIBLE_GROUPS = {
  "Pentateuque": ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy"],
  "Livres historiques": ["Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther"],
  "Livres poétiques": ["Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon"],
  "Prophètes majeurs": ["Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel"],
  "Prophètes mineurs": ["Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"],
  "Évangiles": ["Matthew","Mark","Luke","John"],
  "Histoire NT": ["Acts"],
  "Épîtres de Paul": ["Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon"],
  "Épîtres générales": ["Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude"],
  "Prophétie NT": ["Revelation"]
};

// =============================================
// CHAPITRES COMPLETS DE LA BIBLE (66 livres)
// =============================================
const BC_FULL = {
  Genesis:50, Exodus:40, Leviticus:27, Numbers:36, Deuteronomy:34,
  Joshua:24, Judges:21, Ruth:4, "1 Samuel":31, "2 Samuel":24,
  "1 Kings":22, "2 Kings":25, "1 Chronicles":29, "2 Chronicles":36,
  Ezra:10, Nehemiah:13, Esther:10, Job:42, Psalms:150, Proverbs:31,
  Ecclesiastes:12, "Song of Solomon":8, Isaiah:66, Jeremiah:52,
  Lamentations:5, Ezekiel:48, Daniel:12, Hosea:14, Joel:3, Amos:9,
  Obadiah:1, Jonah:4, Micah:7, Nahum:3, Habakkuk:3, Zephaniah:3,
  Haggai:2, Zechariah:14, Malachi:4,
  Matthew:28, Mark:16, Luke:24, John:21, Acts:28, Romans:16,
  "1 Corinthians":16, "2 Corinthians":13, Galatians:6, Ephesians:6,
  Philippians:4, Colossians:4, "1 Thessalonians":5, "2 Thessalonians":3,
  "1 Timothy":6, "2 Timothy":4, Titus:3, Philemon:1, Hebrews:13,
  James:5, "1 Peter":5, "2 Peter":3, "1 John":5, "2 John":1,
  "3 John":1, Jude:1, Revelation:22
};
