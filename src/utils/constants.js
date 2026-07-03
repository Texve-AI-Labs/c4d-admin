export const constants = {
    andriodUrl: 'https://9728-103-171-10-244.ngrok-free.app/api/customer/dev',
    iosUrl: 'https://9728-103-171-10-244.ngrok-free.app/api/customer/dev',
    // url_dev: 'https://special-kiwi-apparent.ngrok-free.app', //gokul
    // url_dev: 'https://becoming-careful-fish.ngrok-free.app', //mukesh
    // url_dev : 'https://leading-alien-thankfully.ngrok-free.app', //balaji
    // url_dev : 'https://scorpion-flying-rarely.ngrok-free.app',
    // url_dev: 'https://seal-well-mite.ngrok-free.app',
    // url_dev: 'https://perihelial-ariella-unserious.ngrok-free.dev',
    // url_dev: 'https://z2s9hjbf-3000.inc1.devtunnels.ms',
    url: import.meta.env.VITE_API_ENDPOINT,
    url_prepod: 'https://c4d-pre-prod-1089104308138.us-central1.run.app',
    // url_prod:'https://api.c4d.smartapis.cyou',
};

export const getBaseUrl = () => {
    return import.meta.env.VITE_URL_SIT + '/api/customer/dev';
}
export const DISABLE_GLOBAL_AUTOCOMPLETE = false; // true -> off false -> on


export const FUTURE_FLAG = {
    DOCUMENT_DETAILS_LIST: false,
    PENDING_DOCUMENTS_LIST: false
};

export const BOOKING_FEATURES = {
    ADMIN_DISCOUNT_FLOW: true,
};


export const GENDER = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHERS: 'Others'
};

export const TITLE_LIST = [
    { label: 'Mr', value: 'Mr' },
    { label: 'Mrs', value: 'Mrs' },
    { label: 'Miss', value: 'Miss' },
    { label: 'Others', value: 'Others' },
]

export const DISTRICT_LIST = [
    { label: 'Ariyalur', value: 'Ariyalur' },
    { label: 'Chengalpattu', value: 'Chengalpattu' },
    { label: 'Chennai', value: 'Chennai' },
    { label: 'Coimbatore', value: 'Coimbatore' },
    { label: 'Cuddalore', value: 'Cuddalore' },
    { label: 'Dharmapuri', value: 'Dharmapuri' },
    { label: 'Dindigul', value: 'Dindigul' },
    { label: 'Erode', value: 'Erode' },
    { label: 'Kallakurichi', value: 'Kallakurichi' },
    { label: 'Kancheepuram', value: 'Kancheepuram' },
    { label: 'Karur', value: 'Karur' },
    { label: 'Krishnagiri', value: 'Krishnagiri' },
    { label: 'Madurai', value: 'Madurai' },
    { label: 'Mayiladuthurai', value: 'Mayiladuthurai' },
    { label: 'Nagapattinam', value: 'Nagapattinam' },
    { label: 'Kanniyakumari', value: 'Kanniyakumari' },
    { label: 'Namakkal', value: 'Namakkal' },
    { label: 'Perambalur', value: 'Perambalur' },
    { label: 'Pudukottai', value: 'Pudukottai' },
    { label: 'Ramanathapuram', value: 'Ramanathapuram' },
    { label: 'Ranipet', value: 'Ranipet' },
    { label: 'Salem', value: 'Salem' },
    { label: 'Sivagangai', value: 'Sivagangai' },
    { label: 'Tenkasi', value: 'Tenkasi' },
    { label: 'Thiruvallur', value: 'Thiruvallur' },
    { label: 'Thiruvarur', value: 'Thiruvarur' },
    { label: 'Thoothukudi', value: 'Thoothukudi' },
    { label: 'Trichirappalli', value: 'Trichirapalli' },
    { label: 'Thirunelveli', value: 'Thirunelveli' },
    { label: 'Tirupathur', value: 'Tirupathur' },
    { label: 'Tiruppur', value: 'Tiruppur' },
    { label: 'Tiruvannamalai', value: 'Tiruvannamalai' },
    { label: 'The Nilgiris', value: 'The Nilgiris' },
    { label: 'Vellore', value: 'Vellore' },
    { label: 'Villupuram', value: 'Villupuram' },
    { label: 'Virudhunagar', value: 'Virudhunagar' }
]

// export const CITY_LIST = [
//     { label:'Abiramam', value: 'Abiramam'},
//     { label:'Adirampattinam', value: 'Adirampattinam'},
//     { label:'Aduthurai', value: 'Aduthurai'},
//     { label:'Alagapuram', value: 'Alagapuram'},
//     { label:'Alandur', value: 'Alandur'},
//     { label:'Alanganallur', value: 'Alanganallur'},
//     { label:'Alangayam', value: 'Alangayam'},
//     { label:'Alangudi', value: 'Alangudi'},
//     { label:'Alangulam', value: 'Alangulam'},
//     { label:'Alappakkam', value: 'Alappakkam'},
//     { label:'Alwa Tirunagari', value: 'Alwa Tirunagari'},
//     { label:'Ambasamudram', value: 'Ambasamudram'},
//     { label:'Ambattur', value: 'Ambattur'},
//     { label:'Ambur', value: 'Ambur'},
//     { label:'Ammapettai', value: 'Ammapettai'},
//     { label:'Anamalais', value: 'Anamalais'},
//     { label:'Andippatti', value: 'Andippatti'},
//     { label: 'Annamalainagar', value: 'Annamalainagar'},
//     { label: 'Annavasal', value: 'Annavasal'},
//     { label: 'Annur', value: 'Annur'},
//     { label: 'Anthiyur', value: 'Anthiyur'},
//     { label: 'Arakkonam', value: 'Arakkonam'},
//     { label: 'Arantangi', value: 'Arantangi'},
//     { label: 'Arcot', value: 'Arcot'},
//     { label: 'Arimalam', value: 'Arimalam'},
//     { label: 'Ariyalur', value: 'Ariyalur'},
//     { label: 'Arni', value: 'Arni'},
//     { label: 'Arumbavur', value: 'Arumbavur'},
//     { label: 'Arumuganeri', value: 'Arumuganeri'},
//     { label: 'Aruppukkottai', value: 'Aruppukkottai'},
//     { label: 'Aruvankad', value: 'Aruvankad'},
//     { label: 'Attayyampatti', value: 'Attayyampatti'},
//     { label: 'Attur', value: 'Attur'},
//     { label: 'Auroville', value: 'Auroville'},
//     { label: 'Avadi', value: 'Avadi'},
//     { label: 'Avinashi', value: 'Avinashi'},
//     { label: 'Ayakudi', value: 'Ayakudi'},
//     { label: 'Ayyampettai', value: 'Ayyampettai'},
//     { label: 'Belur', value: 'Belur'},
//     { label: 'Bhavani', value: 'Bhavani'},
//     { label: 'Bodinayakkanur', value: 'Bodinayakkanur'},
//     { label: 'Chengam', value: 'Chengam'},
//     { label: 'Chennai', value: 'Chennai'},
//     { label: 'Chennimalai', value: 'Chennimalai'},
//     { label: 'Chetput', value: 'Chetput'},
//     { label: 'Chettipalaiyam', value: 'Chettipalaiyam'},
//     { label: 'Cheyyar', value: 'Cheyyar'},
//     { label: 'Cheyyur', value: 'Cheyyur'},
//     { label: 'Chidambaram', value: 'Chidambaram'},
//     { label: 'Chingleput', value: 'Chingleput'},
//     { label: 'Chinna Salem', value: 'Chinna Salem'},
//     { label: 'Chinnamanur', value: 'Chinnamanur'},
//     { label: 'Chinnasekkadu', value: 'Chinnasekkadu'},
//     { label: 'Cholapuram', value: 'Cholapuram'},
//     { label: 'Coimbatore', value: 'Coimbatore'},
//     { label: 'Colachel', value: 'Colachel'},
//     { label: 'Cuddalore', value: 'Cuddalore'},
//     { label: 'Cumbum', value: 'Cumbum'},
//     { label: 'Denkanikota', value: 'Denkanikota'},
//     { label: 'Desur', value: 'Desur'},
//     { label: 'Devadanappatti', value: 'Devadanappatti'},
//     { label: 'Devakottai', value: 'Devakottai'},
//     { label: 'Dhali', value: 'Dhali'},
//     { label: 'Dharapuram', value: 'Dharapuram'},
//     { label: 'Dharmapuri', value: 'Dharmapuri'},
//     { label: 'Dindigul', value: 'Dindigul'},
//     { label: 'Dusi', value: 'Dusi'},
//     { label: 'Elayirampannai', value: 'Elayirampannai'},
//     { label: 'Elumalai', value: 'Elumalai'},
//     { label: 'Eral', value: 'Eral'},
//     { label: 'Eraniel', value: 'Eraniel'},
//     { label: 'Erode', value: 'Erode'},
//     { label: 'Erumaippatti', value: 'Erumaippatti'},
//     { label: 'Ettaiyapuram', value: 'Ettaiyapuram'},
//     { label: 'Gandhi Nagar', value: 'Gandhi Nagar'},
//   { label: 'Gangaikondan', value: 'Gangaikondan'},
//   { label: 'Gangavalli', value: 'Gangavalli'},
//   { label: 'Gingee', value: 'Gingee'},
//   { label: 'Gobichettipalayam', value: 'Gobichettipalayam'},
//   { label: 'Gudalur', value: 'Gudalur'},
//   { label: 'Gudiyatham', value: 'Gudiyatham'},
//   { label: 'Guduvancheri', value: 'Guduvancheri'},
//   { label: 'Gummidipundi', value: 'Gummidipundi'},
//   { label: 'Harur', value: 'Harur'},
//   { label: 'Hosur', value: 'Hosur'},
//   { label: 'Idappadi', value: 'Idappadi'},
//   { label: 'Ilampillai', value: 'Ilampillai'},
//   { label: 'Iluppur', value: 'Iluppur'},
//   { label: 'Injambakkam', value: 'Injambakkam'},
//   { label: 'Irugur', value: 'Irugur'},
//   { label: 'Jalakandapuram', value: 'Jalakandapuram'},
//   { label: 'Jalarpet', value: 'Jalarpet'},
//   { label: 'Jayamkondacholapuram', value: 'Jayamkondacholapuram'},
//   { label: 'Kadambur', value: 'Kadambur'},
//   { label: 'Kadayanallur', value: 'Kadayanallur'},
//   { label: 'Kalakkadu', value: 'Kalakkadu'},
//   { label: 'Kalavai', value: 'Kalavai'},
//   { label: 'Kallakkurichchi', value: 'Kallakkurichchi'},
//   { label: 'Kallidaikurichi', value: 'Kallidaikurichi'},
//   { label: 'Kallupatti', value: 'Kallupatti'},
//   { label: 'Kalugumalai', value: 'Kalugumalai'},
//   { label: 'Kamuthi', value: 'Kamuthi'},
//   { label: 'Kanadukattan', value: 'Kanadukattan'},
//   { label: 'Kancheepuram', value: 'Kancheepuram'},
//   { label: 'Kanchipuram', value: 'Kanchipuram'},
//   { label: 'Kangayam', value: 'Kangayam'},
//   { label: 'Kanniyakumari', value: 'Kanniyakumari'},
//   { label: 'Karaikkudi', value: 'Karaikkudi'},
//   { label: 'Karamadai', value: 'Karamadai'},
//   { label: 'Karambakkudi', value: 'Karambakkudi'},
//   { label: 'Kariapatti', value: 'Kariapatti'},
//   { label: 'Karumbakkam', value: 'Karumbakkam'},
//   { label: 'Karur', value: 'Karur'},
//   { label: 'Katpadi', value: 'Katpadi'},
//   { label: 'Kattivakkam', value: 'Kattivakkam'},
//   { label: 'Kattupputtur', value: 'Kattupputtur'},
//   { label: 'Kaveripatnam', value: 'Kaveripatnam'},
//   { label: 'Kayalpattinam', value: 'Kayalpattinam'},
//   { label: 'Kayattar', value: 'Kayattar'},
//   { label: 'Keelakarai', value: 'Keelakarai'},
//   { label: 'Kelamangalam', value: 'Kelamangalam'},
//   { label: 'Kil Bhuvanagiri', value: 'Kil Bhuvanagiri'},
//   { label: 'Kilvelur', value: 'Kilvelur'},
//   { label: 'Kiranur', value: 'Kiranur'},
//   { label: 'Kodaikanal', value: 'Kodaikanal'},
//   { label: 'Kodumudi', value: 'Kodumudi'},
//   { label: 'Kombai', value: 'Kombai'},
//   { label: 'Konganapuram', value: 'Konganapuram'},
//   { label: 'Koothanallur', value: 'Koothanallur'},
//   { label: 'Koradachcheri', value: 'Koradachcheri'},
//   { label: 'Korampallam', value: 'Korampallam'},
//   { label: 'Kotagiri', value: 'Kotagiri'},
//   { label: 'Kottaiyur', value: 'Kottaiyur'},
//   { label: 'Kovilpatti', value: 'Kovilpatti'},
//   { label: 'Krishnagiri', value: 'Krishnagiri'},
//   { label: 'Kulattur', value: 'Kulattur'},
//   { label: 'Kulittalai', value: 'Kulittalai'},
//   { label: 'Kumaralingam', value: 'Kumaralingam'},
//   { label: 'Kumbakonam', value: 'Kumbakonam'},
//   { label: 'Kunnattur', value: 'Kunnattur'},
//   { label: 'Kurinjippadi', value: 'Kurinjippadi'},
//   { label: 'Kuttalam', value: 'Kuttalam'},
//   { label: 'Kuzhithurai', value: 'Kuzhithurai'},
//   { label: 'Lalgudi', value: 'Lalgudi'},
//   { label: 'Madambakkam', value: 'Madambakkam'},
//   { label: 'Madipakkam', value: 'Madipakkam'},
//   { label: 'Madukkarai', value: 'Madukkarai'},
//   { label: 'Madukkur', value: 'Madukkur'},
//   { label: 'Madurai', value: 'Madurai'},
//   { label: 'Madurantakam', value: 'Madurantakam'},
//   { label: 'Mallapuram', value: 'Mallapuram'},
//   { label: 'Mallasamudram', value: 'Mallasamudram'},
//   { label: 'Mallur', value: 'Mallur'},
//   { label: 'Manali', value: 'Manali'},
//   { label: 'Manalurpettai', value: 'Manalurpettai'},
//   { label: 'Manamadurai', value: 'Manamadurai'},
//   { label: 'Manappakkam', value: 'Manappakkam'},
//   { label: 'Manapparai', value: 'Manapparai'},
//   { label: 'Manavalakurichi', value: 'Manavalakurichi'},
//   { label: 'Mandapam', value: 'Mandapam'},
//   { label: 'Mangalam', value: 'Mangalam'},
//   { label: 'Mannargudi', value: 'Mannargudi'},
//   { label: 'Marakkanam', value: 'Marakkanam'},
//   { label: 'Marandahalli', value: 'Marandahalli'},
//   { label: 'Masinigudi', value: 'Masinigudi'},
//   { label: 'Mattur', value: 'Mattur'},
//   { label: 'Mayiladuthurai', value: 'Mayiladuthurai'},
//   { label: 'Melur', value: 'Melur'},
//   { label: 'Mettuppalaiyam', value: 'Mettuppalaiyam'},
//   { label: 'Mettur', value: 'Mettur'},
//   { label: 'Minjur', value: 'Minjur'},
//   { label: 'Mohanur', value: 'Mohanur'},
//   { label: 'Mudukulattur', value: 'Mudukulattur'},
//   { label: 'Mulanur', value: 'Mulanur'},
//   { label: 'Musiri', value: 'Musiri'},
//   { label: 'Muttupet', value: 'Muttupet'},
//   { label: 'Naduvattam', value: 'Naduvattam'},
//   { label: 'Nagapattinam', value: 'Nagapattinam'},
//   { label: 'Nagercoil', value: 'Nagercoil'},
//   { label: 'Namagiripettai', value: 'Namagiripettai'},
//   { label: 'Namakkal', value: 'Namakkal'},
//   { label: 'Nambiyur', value: 'Nambiyur'},
//   { label: 'Nambutalai', value: 'Nambutalai'},
//   { label: 'Nandambakkam', value: 'Nandambakkam'},
//   { label: 'Nangavalli', value: 'Nangavalli'},
//   { label: 'Nangilickondan', value: 'Nangilickondan'},
//   { label: 'Nanguneri', value: 'Nanguneri'},
//   { label: 'Nannilam', value: 'Nannilam'},
//   { label: 'Naravarikuppam', value: 'Naravarikuppam'},
//   { label: 'Nattam', value: 'Nattam'},
//   { label: 'Nattarasankottai', value: 'Nattarasankottai'},
//   { label: 'Needamangalam', value: 'Needamangalam'},
//   { label: 'Neelankarai', value: 'Neelankarai'},
//   { label: 'Negapatam', value: 'Negapatam'},
//   { label: 'Nellikkuppam', value: 'Nellikkuppam'},
//   { label: 'Nilakottai', value: 'Nilakottai'},
//   { label: 'Nilgiris', value: 'Nilgiris'},
//   { label: 'Odugattur', value: 'Odugattur'},
//   { label: 'Omalur', value: 'Omalur'},
//   { label: 'Ooty', value: 'Ooty'},
//   { label: 'Padmanabhapuram', value: 'Padmanabhapuram'},
//   { label: 'Palakkodu', value: 'Palakkodu'},
//   { label: 'Palamedu', value: 'Palamedu'},
//   { label: 'Palani', value: 'Palani'},
//   { label: 'Palavakkam', value: 'Palavakkam'},
//   { label: 'Palladam', value: 'Palladam'},
//   { label: 'Pallappatti', value: 'Pallappatti'},
//   { label: 'Pallattur', value: 'Pallattur'},
//   { label: 'Pallavaram', value: 'Pallavaram'},
//   { label: 'Pallikondai', value: 'Pallikondai'},
//   { label: 'Pallipattu', value: 'Pallipattu'},
//   { label: 'Pallippatti', value: 'Pallippatti'},
//   { label: 'Panruti', value: 'Panruti'},
//   { label: 'Papanasam', value: 'Papanasam'},
//   { label: 'Papireddippatti', value: 'Papireddippatti'},
//   { label: 'Papparappatti', value: 'Papparappatti'},
//   { label: 'Paramagudi', value: 'Paramagudi'},
//   { label: 'Pattukkottai', value: 'Pattukkottai'},
//   { label: 'Pennadam', value: 'Pennadam'},
//   { label: 'Pennagaram', value: 'Pennagaram'},
//   { label: 'Pennathur', value: 'Pennathur'},
//   { label: 'Peraiyur', value: 'Peraiyur'},
//   { label: 'Perambalur', value: 'Perambalur'},
//   { label: 'Peranamallur', value: 'Peranamallur'},
//   { label: 'Peranampattu', value: 'Peranampattu'},
//   { label: 'Peravurani', value: 'Peravurani'},
//   { label: 'Periyakulam', value: 'Periyakulam'},
//   { label: 'Periyanayakkanpalaiyam', value: 'Periyanayakkanpalaiyam'},
//   { label: 'Periyanegamam', value: 'Periyanegamam'},
//   { label: 'Periyapatti', value: 'Periyapatti'},
//   { label: 'Periyapattinam', value: 'Periyapattinam'},
//   { label: 'Perundurai', value: 'Perundurai'},
//   { label: 'Perungudi', value: 'Perungudi'},
//   { label: 'Perur', value: 'Perur'},
//   { label: 'Pollachi', value: 'Pollachi'},
//   { label: 'Polur', value: 'Polur'},
//   { label: 'Ponnamaravati', value: 'Ponnamaravati'},
//   { label: 'Ponneri', value: 'Ponneri'},
//   { label: 'Poonamalle', value: 'Poonamalle'},
//   { label: 'Porur', value: 'Porur'},
//   { label: 'Pudukkottai', value: 'Pudukkottai'},
//   { label: 'Puduppatti', value: 'Puduppatti'},
//   { label: 'Pudur', value: 'Pudur'},
//   { label: 'Puduvayal', value: 'Puduvayal'},
//   { label: 'Puliyangudi', value: 'Puliyangudi'},
//   { label: 'Puliyur', value: 'Puliyur'},
//   { label: 'Pullambadi', value: 'Pullambadi'},
//   { label: 'Punjai Puliyampatti', value: 'Punjai Puliyampatti'},
//   { label: 'Rajapalaiyam', value: 'Rajapalaiyam'},
//   { label: 'Ramanathapuram', value: 'Ramanathapuram'},
//   { label: 'Rameswaram', value: 'Rameswaram'},
//   { label: 'Rasipuram', value: 'Rasipuram'},
//   { label: 'Saint Thomas Mount', value: 'Saint Thomas Mount'},
//   { label: 'Salem', value: 'Salem'},
//   { label: 'Sathankulam', value: 'Sathankulam'},
//   { label: 'Sathyamangalam', value: 'Sathyamangalam'},
//   { label: 'Sattur', value: 'Sattur'},
//   { label: 'Sayalkudi', value: 'Sayalkudi'},
//   { label: 'Seven Pagodas', value: 'Seven Pagodas'},
//   { label: 'Sholinghur', value: 'Sholinghur'},
//   { label: 'Singanallur', value: 'Singanallur'},
//   { label: 'Singapperumalkovil', value: 'Singapperumalkovil'},
//   { label: 'Sirkazhi', value: 'Sirkazhi'},
//   { label: 'Sirumugai', value: 'Sirumugai'},
//   { label: 'Sivaganga', value: 'Sivaganga'},
//   { label: 'Sivagiri', value: 'Sivagiri'},
//   { label: 'Sivakasi', value: 'Sivakasi'},
//   { label: 'Srimushnam', value: 'Srimushnam'},
//   { label: 'Sriperumbudur', value: 'Sriperumbudur'},
//   { label: 'Srivaikuntam', value: 'Srivaikuntam'},
//   { label: 'Srivilliputhur', value: 'Srivilliputhur'},
//   { label: 'Suchindram', value: 'Suchindram'},
//   { label: 'Sulur', value: 'Sulur'},
//   { label: 'Surandai', value: 'Surandai'},
//   { label: 'Swamimalai', value: 'Swamimalai'},
//   { label: 'Tambaram', value: 'Tambaram'},
//   { label: 'Tanjore', value: 'Tanjore'},
//   { label: 'Taramangalam', value: 'Taramangalam'},
//   { label: 'Tattayyangarpettai', value: 'Tattayyangarpettai'},
//   { label: 'Thanjavur', value: 'Thanjavur'},
//   { label: 'Tharangambadi', value: 'Tharangambadi'},
//   { label: 'Theni', value: 'Theni'},
//   { label: 'Thenkasi', value: 'Thenkasi'},
//   { label: 'Thirukattupalli', value: 'Thirukattupalli'},
//   { label: 'Thiruthani', value: 'Thiruthani'},
//   { label: 'Thiruvaiyaru', value: 'Thiruvaiyaru'},
//   { label: 'Thiruvallur', value: 'Thiruvallur'},
//   { label: 'Thiruvarur', value: 'Thiruvarur'},
//   { label: 'Thiruvidaimaruthur', value: 'Thiruvidaimaruthur'},
//   { label: 'Thoothukudi', value: 'Thoothukudi'},
//   { label: 'Tindivanam', value: 'Tindivanam'},
//   { label: 'Tinnanur', value: 'Tinnanur'},
//   { label: 'Tiruchchendur', value: 'Tiruchchendur'},
//   { label: 'Tiruchengode', value: 'Tiruchengode'},
//   { label: 'Tiruchirappalli', value: 'Tiruchirappalli'},
//   { label: 'Tirukkoyilur', value: 'Tirukkoyilur'},
//   { label: 'Tirumullaivasal', value: 'Tirumullaivasal'},
//   { label: 'Tirunelveli', value: 'Tirunelveli' },
//   { label: 'Tirunelveli Kattabo', value: 'Tirunelveli Kattabo' },
//   { label: 'Tiruppalaikudi', value: 'Tiruppalaikudi' },
//   { label: 'Tirupparangunram', value: 'Tirupparangunram' },
//   { label: 'Tiruppur', value: 'Tiruppur' },
//   { label: 'Tiruppuvanam', value: 'Tiruppuvanam' },
//   { label: 'Tiruttangal', value: 'Tiruttangal' },
//   { label: 'Tiruvannamalai', value: 'Tiruvannamalai' },
//   { label: 'Tiruvottiyur', value: 'Tiruvottiyur' },
//   { label: 'Tisaiyanvilai', value: 'Tisaiyanvilai' },
//   { label: 'Tondi', value: 'Tondi' },
//   { label: 'Turaiyur', value: 'Turaiyur' },
//   { label: 'Udangudi', value: 'Udangudi' },
//   { label: 'Udumalaippettai', value: 'Udumalaippettai' },
//   { label: 'Uppiliyapuram', value: 'Uppiliyapuram' },
//   { label: 'Usilampatti', value: 'Usilampatti' },
//   { label: 'Uttamapalaiyam', value: 'Uttamapalaiyam' },
//   { label: 'Uttiramerur', value: 'Uttiramerur' },
//   { label: 'Uttukkuli', value: 'Uttukkuli' },
//   { label: 'V.S.K.Valasai (Dindigul-Dist.)', value: 'V.S.K.Valasai (Dindigul-Dist.)' },
//   { label: 'Vadakku Valliyur', value: 'Vadakku Valliyur' },
//   { label: 'Vadakku Viravanallur', value: 'Vadakku Viravanallur' },
//   { label: 'Vadamadurai', value: 'Vadamadurai' },
//   { label: 'Vadippatti', value: 'Vadippatti' },
//   { label: 'Valangaiman', value: 'Valangaiman' },
//   { label: 'Valavanur', value: 'Valavanur' },
//   { label: 'Vallam', value: 'Vallam' },
//   { label: 'Valparai', value: 'Valparai' },
//   { label: 'Vandalur', value: 'Vandalur' },
//   { label: 'Vandavasi', value: 'Vandavasi' },
//   { label: 'Vaniyambadi', value: 'Vaniyambadi' },
//   { label: 'Vasudevanallur', value: 'Vasudevanallur' },
//   { label: 'Vattalkundu', value: 'Vattalkundu' },
//   { label: 'Vedaraniyam', value: 'Vedaraniyam' },
//   { label: 'Vedasandur', value: 'Vedasandur' },
//   { label: 'Velankanni', value: 'Velankanni' },
//   { label: 'Vellanur', value: 'Vellanur' },
//   { label: 'Vellore', value: 'Vellore' },
//   { label: 'Velur', value: 'Velur' },
//   { label: 'Vengavasal', value: 'Vengavasal' },
//   { label: 'Vettaikkaranpudur', value: 'Vettaikkaranpudur' },
//   { label: 'Vettavalam', value: 'Vettavalam' },
//   { label: 'Vijayapuri', value: 'Vijayapuri' },
//   { label: 'Vikravandi', value: 'Vikravandi' },
//   { label: 'Vilattikulam', value: 'Vilattikulam' },
//   { label: 'Villupuram', value: 'Villupuram' },
//   { label: 'Viraganur', value: 'Viraganur' },
//   { label: 'Virudhunagar', value: 'Virudhunagar' },
//   { label: 'Vriddhachalam', value: 'Vriddhachalam' },
//   { label: 'Walajapet', value: 'Walajapet' },
//   { label: 'Wallajahbad', value: 'Wallajahbad' },
//   { label: 'Wellington', value: 'Wellington' }  
// ]

export const THALUK_LIST = [
    { label: 'Abiramam', value: 'Abiramam' },
    { label: 'Alangudi', value: 'Alangudi' },
    { label: 'Alangulam', value: 'Alangulam' },
    { label: 'Alathur', value: 'Alathur' },
    { label: 'Ambasamudram', value: 'Ambasamudram' },
    { label: 'Ambur', value: 'Ambur' },
    { label: 'Anaicut', value: 'Anaicut' },
    { label: 'Anaimalai', value: 'Anaimalai' },
    { label: 'Andimadam', value: 'Andimadam' },
    { label: 'Andipatti', value: 'Andipatti' },
    { label: 'Annur', value: 'Annur' },
    { label: 'Arakkonam', value: 'Arakkonam' },
    { label: 'Arani', value: 'Arani' },
    { label: 'Aranthangi', value: 'Aranthangi' },
    { label: 'Arcot', value: 'Arcot' },
    { label: 'Ariyalur', value: 'Ariyalur' },
    { label: 'Aruppukottai', value: 'Aruppukottai' },
    { label: 'Athoor', value: 'Athoor' },
    { label: 'Attur', value: 'Attur' },
    { label: 'Avadi', value: 'Avadi' },
    { label: 'Avinashi', value: 'Avinashi' },
    { label: 'Bargur', value: 'Bargur' },
    { label: 'Bhavani', value: 'Bhavani' },
    { label: 'Bhuvanagiri', value: 'Bhuvanagiri' },
    { label: 'Bodinayakanur', value: 'Bodinayakanur' },
    { label: 'Chengalpattu', value: 'Chengalpattu' },
    { label: 'Chengam', value: 'Chengam' },
    { label: 'Cheranmahadevi', value: 'Cheranmahadevi' },
    { label: 'Cheyyar', value: 'Cheyyar' },
    { label: 'Cheyyur', value: 'Cheyyur' },
    { label: 'Chidambaram', value: 'Chidambaram' },
    { label: 'Chinnasalem', value: 'Chinnasalem' },
    { label: 'Coimbatore North', value: 'Coimbatore North' },
    { label: 'Coimbatore South', value: 'Coimbatore South' },
    { label: 'Coonoor', value: 'Coonoor' },
    { label: 'Cuddalore', value: 'Cuddalore' },
    { label: 'Denkanikottai', value: 'Denkanikottai' },
    { label: 'Devakottai', value: 'Devakottai' },
    { label: 'Dharapuram', value: 'Dharapuram' },
    { label: 'Dharmapuri', value: 'Dharmapuri' },
    { label: 'Dindigul East', value: 'Dindigul East' },
    { label: 'Dindigul West', value: 'Dindigul West' },
    { label: 'Edappadi', value: 'Edappadi' },
    { label: 'Erode', value: 'Erode' },
    { label: 'Gangavalli', value: 'Gangavalli' },
    { label: 'Gobichettipalayam', value: 'Gobichettipalayam' },
    { label: 'Gudalur', value: 'Gudalur' },
    { label: 'Gudiyatham', value: 'Gudiyatham' },
    { label: 'Gummidipoondi', value: 'Gummidipoondi' },
    { label: 'Harur', value: 'Harur' },
    { label: 'Hosur', value: 'Hosur' },
    { label: 'Ilayangudi', value: 'Ilayangudi' },
    { label: 'Illuppur', value: 'Illuppur' },
    { label: 'Kadayanallur', value: 'Kadayanallur' },
    { label: 'Kallakurichi', value: 'Kallakurichi' },
    { label: 'Kallikudi', value: 'Kallikudi' },
    { label: 'Kalvarayan Hills', value: 'Kalvarayan Hills' },
    { label: 'Kanchipuram', value: 'Kanchipuram' },
    { label: 'Kangayam', value: 'Kangayam' },
    { label: 'Karaikudi', value: 'Karaikudi' },
    { label: 'Karambakudi', value: 'Karambakudi' },
    { label: 'Karur', value: 'Karur' },
    { label: 'Katpadi', value: 'Katpadi' },
    { label: 'Kattumannarkoil', value: 'Kattumannarkoil' },
    { label: 'Kilpennathur', value: 'Kilpennathur' },
    { label: 'Kilvelur', value: 'Kilvelur' },
    { label: 'Kinathukadavu', value: 'Kinathukadavu' },
    { label: 'Kodaikanal', value: 'Kodaikanal' },
    { label: 'Kodumudi', value: 'Kodumudi' },
    { label: 'Koilpatti', value: 'Koilpatti' },
    { label: 'Kotagiri', value: 'Kotagiri' },
    { label: 'Krishnagiri', value: 'Krishnagiri' },
    { label: 'Krishnarayapuram', value: 'Krishnarayapuram' },
    { label: 'Kulithalai', value: 'Kulithalai' },
    { label: 'Kumbakonam', value: 'Kumbakonam' },
    { label: 'Kunnam', value: 'Kunnam' },
    { label: 'Kuthalam', value: 'Kuthalam' },
    { label: 'Lalgudi', value: 'Lalgudi' },
    { label: 'Madurai East', value: 'Madurai East' },
    { label: 'Madurai North', value: 'Madurai North' },
    { label: 'Madurai South', value: 'Madurai South' },
    { label: 'Madurai West', value: 'Madurai West' },
    { label: 'Maduranthakam', value: 'Maduranthakam' },
    { label: 'Manamadurai', value: 'Manamadurai' },
    { label: 'Mannargudi', value: 'Mannargudi' },
    { label: 'Mayiladuthurai', value: 'Mayiladuthurai' },
    { label: 'Melur', value: 'Melur' },
    { label: 'Mettupalayam', value: 'Mettupalayam' },
    { label: 'Mettur', value: 'Mettur' },
    { label: 'Mohanur', value: 'Mohanur' },
    { label: 'Mudukulathur', value: 'Mudukulathur' },
    { label: 'Musiri', value: 'Musiri' },
    { label: 'Nagapattinam', value: 'Nagapattinam' },
    { label: 'Nagercoil', value: 'Nagercoil' },
    { label: 'Namakkal', value: 'Namakkal' },
    { label: 'Nanguneri', value: 'Nanguneri' },
    { label: 'Natham', value: 'Natham' },
    { label: 'Needamangalam', value: 'Needamangalam' },
    { label: 'Nilakkottai', value: 'Nilakkottai' },
    { label: 'Oddanchatram', value: 'Oddanchatram' },
    { label: 'Omalur', value: 'Omalur' },
    { label: 'Orathanadu', value: 'Orathanadu' },
    { label: 'Ottapidaram', value: 'Ottapidaram' },
    { label: 'Palani', value: 'Palani' },
    { label: 'Palladam', value: 'Palladam' },
    { label: 'Pallavaram', value: 'Pallavaram' },
    { label: 'Panruti', value: 'Panruti' },
    { label: 'Papanasam', value: 'Papanasam' },
    { label: 'Paramakudi', value: 'Paramakudi' },
    { label: 'Paramathi-Velur', value: 'Paramathi-Velur' },
    { label: 'Pattukkottai', value: 'Pattukkottai' },
    { label: 'Pennagaram', value: 'Pennagaram' },
    { label: 'Perambalur', value: 'Perambalur' },
    { label: 'Periyakulam', value: 'Periyakulam' },
    { label: 'Perundurai', value: 'Perundurai' },
    { label: 'Pollachi', value: 'Pollachi' },
    { label: 'Polur', value: 'Polur' },
    { label: 'Ponneri', value: 'Ponneri' },
    { label: 'Pudukkottai', value: 'Pudukkottai' },
    { label: 'Purasawalkam', value: 'Purasawalkam' },
    { label: 'Rajapalayam', value: 'Rajapalayam' },
    { label: 'Ramanathapuram', value: 'Ramanathapuram' },
    { label: 'Rameshwaram', value: 'Rameshwaram' },
    { label: 'Rasipuram', value: 'Rasipuram' },
    { label: 'Salem', value: 'Salem' },
    { label: 'Sankarankovil', value: 'Sankarankovil' },
    { label: 'Sankarapuram', value: 'Sankarapuram' },
    { label: 'Sankari', value: 'Sankari' },
    { label: 'Sathankulam', value: 'Sathankulam' },
    { label: 'Sathyamangalam', value: 'Sathyamangalam' },
    { label: 'Sendurai', value: 'Sendurai' },
    { label: 'Sholingur', value: 'Sholingur' },
    { label: 'Sirkazhi', value: 'Sirkazhi' },
    { label: 'Sivaganga', value: 'Sivaganga' },
    { label: 'Sivagiri', value: 'Sivagiri' },
    { label: 'Sivakasi', value: 'Sivakasi' },
    { label: 'Sriperumbudur', value: 'Sriperumbudur' },
    { label: 'Srivilliputhur', value: 'Srivilliputhur' },
    { label: 'Sulur', value: 'Sulur' },
    { label: 'Tambaram', value: 'Tambaram' },
    { label: 'Tenkasi', value: 'Tenkasi' },
    { label: 'Thanjavur', value: 'Thanjavur' },
    { label: 'Theni', value: 'Theni' },
    { label: 'Thirukazhukundram', value: 'Thirukazhukundram' },
    { label: 'Thirumangalam', value: 'Thirumangalam' },
    { label: 'Thiruporur', value: 'Thiruporur' },
    { label: 'Thiruthuraipoondi', value: 'Thiruthuraipoondi' },
    { label: 'Thiruvaiyaru', value: 'Thiruvaiyaru' },
    { label: 'Thiruvallur', value: 'Thiruvallur' },
    { label: 'Thiruvannamalai', value: 'Thiruvannamalai' },
    { label: 'Thiruvarur', value: 'Thiruvarur' },
    { label: 'Thoothukkudi', value: 'Thoothukkudi' },
    { label: 'Thuraiyur', value: 'Thuraiyur' },
    { label: 'Tindivanam', value: 'Tindivanam' },
    { label: 'Tiruchendur', value: 'Tiruchendur' },
    { label: 'Tiruchengode', value: 'Tiruchengode' },
    { label: 'Tiruchirappalli', value: 'Tiruchirappalli' },
    { label: 'Tirukoilur', value: 'Tirukoilur' },
    { label: 'Tirunelveli', value: 'Tirunelveli' },
    { label: 'Tirupattur', value: 'Tirupattur' },
    { label: 'Tiruppur', value: 'Tiruppur' },
    { label: 'Tiruttani', value: 'Tiruttani' },
    { label: 'Tiruvottiyur', value: 'Tiruvottiyur' },
    { label: 'Udayarpalayam', value: 'Udayarpalayam' },
    { label: 'Udumalpet', value: 'Udumalpet' },
    { label: 'Ulundurpet', value: 'Ulundurpet' },
    { label: 'Usilampatti', value: 'Usilampatti' },
    { label: 'Uthangarai', value: 'Uthangarai' },
    { label: 'Uthiramerur', value: 'Uthiramerur' },
    { label: 'Vadipatti', value: 'Vadipatti' },
    { label: 'Valangaiman', value: 'Valangaiman' },
    { label: 'Valparai', value: 'Valparai' },
    { label: 'Vaniyambadi', value: 'Vaniyambadi' },
    { label: 'Vanur', value: 'Vanur' },
    { label: 'Vedasandur', value: 'Vedasandur' },
    { label: 'Vellore', value: 'Vellore' },
    { label: 'Veppur', value: 'Veppur' },
    { label: 'Vilavancode', value: 'Vilavancode' },
    { label: 'Villupuram', value: 'Villupuram' },
    { label: 'Virudhunagar', value: 'Virudhunagar' },
    { label: 'Yercaud', value: 'Yercaud' }
]

export const STATE_LIST = [
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
    { label: 'Assam', value: 'Assam' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Chhattisgarh', value: 'Chhattisgarh' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
    { label: 'Jharkhand', value: 'Jharkhand' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Manipur', value: 'Manipur' },
    { label: 'Meghalaya', value: 'Meghalaya' },
    { label: 'Mizoram', value: 'Mizoram' },
    { label: 'Nagaland', value: 'Nagaland' },
    { label: 'Odisha', value: 'Odisha' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Sikkim', value: 'Sikkim' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Tripura', value: 'Tripura' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'Uttarakhand', value: 'Uttarkhand' },
    { label: 'West Bengal', value: 'West Bengal' },
    { label: 'Chandigarh', value: 'Chandigarh' },
    { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
    { label: 'Ladakh', value: 'Ladakh' },
    { label: 'Delhi', value: 'Delhi' },
    { label: 'Puducherry', value: 'Puducherry' },
]
export const DAY_LIST = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' }
]
export const MONTH_LIST = [
    { label: '1', value: '01' },
    { label: '2', value: '02' },
    { label: '3', value: '03' },
    { label: '4', value: '04' },
    { label: '5', value: '05' },
    { label: '6', value: '06' },
    { label: '7', value: '07' },
    { label: '8', value: '08' },
    { label: '9', value: '09' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' }
]
export const YEAR_LIST = [
    { label: '1990', value: '1990' },
    { label: '1991', value: '1991' },
    { label: '1992', value: '1992' },
    { label: '1993', value: '1993' },
    { label: '1994', value: '1994' },
    { label: '1995', value: '1995' },
    { label: '1996', value: '1996' },
    { label: '1997', value: '1997' },
    { label: '1998', value: '1998' },
    { label: '1999', value: '1999' },
    { label: '2000', value: '2000' },
    { label: '2001', value: '2001' },
    { label: '2002', value: '2002' },
    { label: '2003', value: '2003' },
    { label: '2004', value: '2004' },
    { label: '2005', value: '2005' },
    { label: '2006', value: '2006' },
    { label: '2007', value: '2007' },
    { label: '2008', value: '2008' },
    { label: '2009', value: '2009' },
    { label: '2010', value: '2010' },
]

export const REGION = {
    latitude: 37.78,
    longitude: -122.43,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export const RIDE_DETAILS = [
    {
        pickup: 'Block 2, Vhhs Villa, perungudi',
        drop: 'Street 2, Church road, Nungambakkam',
        driverName: 'Gowtham',
        packageType: 'Intercity',
        carDetails: {
            licenseNumber: 'TN09DB1244',
            nickName: 'My Car'
        },
        amount: '668'
    },
    {
        pickup: 'Block 1, ABC Villa, velachery',
        drop: 'Street 2, Church road, Kanchipurram',
        driverName: 'Kiran Kumar',
        packageType: 'Outstation',
        carDetails: {
            licenseNumber: 'TN09AB0077',
            nickName: 'My Car'
        },
        amount: '1140'
    },
    {
        pickup: 'Street 2, Church road, Nungambakkam',
        drop: 'Block 1, ABC Villa, velachery',
        driverName: 'Gowtham',
        packageType: 'Intercity',
        carDetails: {
            licenseNumber: 'TN09BD5656',
            nickName: 'My Car'
        },
        amount: '400'
    }
];

export const WALLET_AMOUNT = ['200', '500', '1000', '2000'];

export const DRIVER_SEARCH_TYPES = {
    CHOOSE_DRIVER: 'ChooseDriver',
    SEARCH_DRIVER_WITHIN_2KMS: 'SearchDriverWithin2Kms',
    SEARCH_DRIVER_OVER_2KMS: 'SearchDriverOver2Kms',
};

export const IMPRESSIVE_FACTORS_ARR = ['On Time', 'Professional', 'Polite', 'Superfast', 'Knows route', 'Good Communication'];
export const WHAT_WENT_WRONG_ARR = ['Late arrival', 'Route Confussion', 'Aggressive Driver', 'Unprofessional & Rude', 'Poor Communication'];
export const IMPROVEMENT_SUGGESTIONS_ARR = ['Overall Service', 'Customer support', 'Transparency', 'Speed & Efficiency'];
export const TIP_ARR = [10, 20, 30, 40];
export const CONTEXT_LESS_THAN_2 = 'What went wrong?';
export const CONTEXT = 'What were you impressed with?';

export const API_ROUTES = {
    'SESSION_START': '/session/start',
    'LOGOUT': '/logout',
    'MOBILENUMBER_VERIFICATION': '/verify',
    'OTP_VERIFICATION': '/otp-verify',
    'REGISTER_CUSTOMER': '/register',
    'CREATE_ACCOUNT': '/register/admin/account',
    'UPDATE_CUSTOMER': '/customer',
    'UPDATE_ACCOUNT': '/register/admin/account',
    'REGISTER_DRIVER': '/register/admin/driver',
    'UPDATE_DRIVER': '/update/admin/driver',
    'GET_CUSTOMER': '/customer',
    'GET_ACCOUNT': '/register/admin/account',
    'REGISTER_CAR_DETAILS': '/car-number',
    'ADD_CAR_DETAILS': '/car',
    'GET_ALL_CARS': '/cars',
    'GET_SPECIFIC_CAR': '/car',
    'PACKAGES_LIST': '/package-list',
    'ZONE_PACKAGE_LIST': '/zone-packages',
    'GET_PACKAGES_LIST': '/get-package-list/',
    'PACKAGE_CABS_LIST': '/package-list/cabs',
    'ADD_NEW_BOOKING': '/add-booking',
    'ADD_NEW_RIDES_BOOKING': '/add-rides-booking',
    'ADD_NEW_RENTAL_BOOKING': '/add-rental-booking',
    'CONFIRM_ADMIN_BOOKING': '/confirm-booking',
    'UPDATE_BOOKING': '/update-booking',
    'UPDATE_RIDES_BOOKING': '/edit-rides-booking',
    'CANCEL_ADMIN_BOOKING': "/booking-cancel",
    'CHECK_PRESENCE' : '/check-presence',
    'ADD_LOCATION': '/add-location',
    'GET_BOOKING_BY_ID': '/booking',
    'GET_CONFIRMATION_BOOKING_BY_ID': '/bookingConfirmation',
    'GET_DRIVERS': '/drivers',
    'GET_DRIVER_BY_ID': '/driver/',
    'GET_ACCOUNT_BY_ID': '/admin/account',
    'REQUEST_DRIVER': '/request-driver',
    'BASE_AMOUNT': '/base-payment',
    'EXTEND_REQUEST': '/extend-request',
    'ADD_FEEDBACK': '/add-feedback',
    'RIDES': '/rides',
    'GET_ADDRESS': '/get-address',
    'GET_LATLONG': '/get-latlong',
    'SEARCH_ADDRESS': '/search-address',
    'ADD_ADDRESS': '/add-address',
    'ADDRESS': '/address',
    'CANCEL_BOOKING': '/booking-cancel',
    'ADD_PAYMENT': '/add-payment',
    'CASH_PAYMENT': '/offline-payment',
    'DRIVER_CURRENT_LOCATION': '/driver-location',
    'EXPIRE_REQUEST': '/expire-request',
    'GET_NEWS': '/news',
    'GET_CUSTOMERS': '/admin/customer',
    'GET_ALL_CUSTOMERS': '/admin/customers',
    'GET_ALL_DRIVERS': '/admin/drivers',
    'GET_ALL_ACCOUNTS': '/register/admin/account',
    'GET_ONBOARDING_DETAILS': '/register/admin/account/onboarding',
    'GET_DRIVERS_PACKAGE': '/get-drivers',
    'GET_ALL_USERS': '/users',
    'UPDATE_USER': '/users',
    'ADD_USER': '/add-user',
    'USER_LOGIN': '/login',
    'USER_LOGOUT': '/logout',
    'GET_USER_BY_ID': '/users/',
    'GET_USER_BY_TOKEN': '/session/users',
    'GET_PRICE': '/get-price',
    'ADD_PRICE': '/add-price',
    'UPDATE_PRICE': '/update-price',
    'GET_BOOKINGS': '/admin/bookings',
    'UPATE_ADMIN_BOOKINGS': '/admin-booking',
    'UPDATE_DRIVERS': '/admin-driver/update',
    'ADMIN_BOOKING_STATUS': '/admin-booking-status',
    'ADMIN_BOOKING_PRICE': '/get-booking-price',
    'UPDATE_WALLET': '/update-wallet',
    'UPDATE_COMMISSION': '/update/commission',
    'GET_ALL_CABS': '/admin/cabs',
    'REGISTER_CAB': '/register/admin/cab',
    'UPDATE_CAB': '/update/admin/cab',
    'GET_CAB_BY_ID': '/cab/',
    'GET_CABS_PACKAGE': '/get-cabs',
    'UPDATE_CAB_STATUS': '/admin-cab/update',
    'UPLOAD_KYC_DOCUMENTS': '/document/add',
    'UPLOAD_PHOTO': '/photo/add',
    'UPDATE_PHOTO': '/photo/update',
    'GET_DRIVERS_ADMIN': '/admin/driver/',
    'GET_DOCUMENT_DETAILS_LIST': '/admin/documents',
    'GET_DOCUMENT_DETAILS': '/admin/user/documents',
    'GET_ONLINE_REGISTER_DETAILS': '/online-register',
    'GET_CREATE_DRIVER': '/register/driver/',
    'GET_CREATE_OWNER': '/register/account',
    'GET_SUBCRIPTION_PLAN': '/admin/plan',
    'GET_SUBSCRIPTION_LIST': '/admin/subscription',
    'CREATE_SUBSCRIPTION': '/admin/subscription/create',
    'GET_ACCOUNTS': '/admin/accounts',
    'GET_DRIVERS_FOR_SUBSCRIPTION': '/admin/subscription/drivers',
    'GET_ACCOUNT_CABS': '/account/cabs/',
    'GET_ACCOUNT_RELATED_DRIVERS': '/account/drivers',
    'CHECK_DRIVER': '/check-driver/',
    'GET_PAYABLE': '/payment-request',
    'GET_PAYABLE_DETAILS': '/invoice-trip-details',
    'REVIEW_PAYMENT_REQUEST': '/update-payment-request',
    'APPROVE_PAYMENT_REQUEST': '/approve-payment-request',
    'ADD_MASTER_SUBSCRIPTION_ADD': '/admin/plan-group',
    'GET_MASTER_SUBSCRIPTION_LIST': '/admin/plan-groups',
    'GET_MASTER_SUBSCRIPTION_DETAIL': '/admin/plan-groups',
    'GET_QUOTE_OUTSTATION': '/get-quote',
    'ADMIN_DISCOUNT_APPROVE': '/booking/admin-discount/approve',
    'ADMIN_DISCOUNT_REJECT': '/booking/admin-discount/reject',
    'ADMIN_DISCOUNT_HISTORY': '/booking/admin-discount/history',
    'ADMIN_DISCOUNT_STATUS': '/booking/admin-discount/status',
    'ACTING_DRIVER_ADD_LOCAL_PACKAGE': '/add-package',
    'ACTING_DRIVER_EDIT_LOCAL_PACKAGE': '/update-package',
    'ACTING_DRIVER_ADD_OUTSTAION_PACKAGE': '/add-outstation-package',
    'ACTING_DRIVER_EDIT_OUTSTATION_PACKAGE': '/update-outstation-package',
    'GET_PACKAGE_DETAIL': '/package-list/',
    'GET_RECEIPT_LIST': '/admin/receipt',
    'GET_INVOICE_LIST': '/admin/list-invoices',
    'GET_INVOICE_DETAILS': '/admin/invoices',
    'UPDATE_INVOICE_STATUS_DETAILS': '/admin/invoice',
    'GET_RECEIPT_DETAILS': '/admin/receipts',
    'ADD_RIDES_PRICE_TABLE': '/add-rides-package',
    'ADD_RENTALS_PRICE_TABLE': '/add-rental-package',
    'RENTALS_PRICE_DETAILS': '/rentals-package-list',
    'RIDES_PRICE_TABLE_LIST': '/rides-package-list',
    'RIDES_PRICE_DETAILS': '/package-list',
    'RIDES_PRICE_EDIT': '/update-rides-package',
    'MASTERPRICETABLE_LOG': '/package-list/log/',
    'RENDAL_PRICE_EDIT': '/update-rental-package',
    'MASTER_SUBSCRIPTION_EDIT': '/admin/plan-group',
    'CAB_PRICE_TABLE_LOG': '/price-list/log/',
    'GET_RIDES_CAB_DRIVERS': '/assign/driver',
    'GET_RENTAL_CAB_DRIVERS': '/assign/rentalDriver',
    'RIDES_DRIVER_LIST': '/driver-request-list',
    'RENTAL_REQUEST': '/request-rental',
    'CONFIRM_RIDES_BOOKING': '/confirm-rides-booking',
    'CONFIRM_RENTAL_BOOKING': '/confirm-rental-booking',
    'GEO_MARKINGS': '/geo-markings',
    'GEO_MARKINGS_LIST': '/geo-markings/filter',
    'RENTAL_OUTSTATION_TARIFFS': '/rental/outstation/tariffs',
    'GEO_MARKINGS_DELETE': '/geo-markings',
    'GET_CAR_TYPE': '/car-type/',
    'POST_NOTIFICATION_ADD': '/send-notification',
    'UPDATE_NOTIFICATION': '/update-scheduled-notification',
    'CANCEL_NOTIFICATION': '/cancel-scheduled-notification',
    'GET_NOTIFICATION': '/get-notification',
    'INSTANT_REWARD': '/instant-reward',
    'GET_REWARD': '/get-instant-reward',
    'CUSTOMER_WALLET': '/getWalletTransactions',
    'DRIVER_WALLET': '/getDriverWalletTransactions',
    'CAB_WALLET': '/getCabWalletTransactions',
    'ADD_NOTES_BOOKING': '/add-notes',
    'GET_NOTES_BOOKING':'/get-notes',
    'GET_ALL_VEHICLESLIST': '/admin/cabs',
    'PUT_OWNER_SHIP': '/update-booking-ownership',
    'DRIVER_NOTIFY': '/notify',
    'GET_DRIVER_NOTIFY':'/get-notify-contents',
    'UPDATE_DRIVER_NOTIFY':'/update-notify',
    'GET_VERSIONCONTROL':'/get-current-version',
    'PUT_VERSIONCONTROL':'/update-current-version',
    'GET_DISCOUNT':'/all-discount',
    'POST_DISCOUNT':'/add-discount',
    'PUT_DISCOUNT':'/update-discount',
    'GET_GST':'/list-gst',
    'PUT_GST':'/update-gst',
    'POST_GST':'/add-gst',
    'GET_BANNER':'/banner',
    'POST_BANNER':'/banner/add',
    'UPDATE_BANNER':'/banner/update',
    // 'GET_TESTIMOINAL':'/testimonial',
    // 'POST_TESTIMOINAL':'/testimonial/add',
    // 'UPDATE_TESTIMONIAL':'/testimonial/update',
    'GET_AUTO_LIST':"/admin/autos",
    'ADD_NEW_AUTO_BOOKING':'/add-auto-booking',
    'POST_AUTO_SEARCH':'/search/auto',
    'ADD_NEW_AUTO_DETAILS':'/register/admin/auto',
    'CREATE_PARCEL_ADMIN' :'/register/admin/parcel',
    'GET_ALL_PARCEL': '/admin/parcel',
    'UPDATE_LANDMARK':'/update-landmark',
    'GET_AUTO_PACKAGE':'/get-autos',
    'GET_AUTO_BY_ID':'/auto/',
    'UPDATE_AUTO_DETAILS':'/update/admin/auto',
    'AUTO_PACKAGE_LIST':'/auto-package-list',
    'AUTO_PRICE_EDIT':'/update-auto-package',
    'ADD_PARCEL_PRICE':'/parcel-package',
    'PARCEL_PACKAGE_LIST':'/parcel-package-list',
    'PARCEL_PACKAGE_BY_ID':'/parcel-package',
    'PARCEL_PRICE_EDIT':'/update-parcel-package',
    'GET_PARCEL_CAB_BY_ID':'/parcel/', 
    'UPDATE_PARCEL_CAB':'/update/admin/parcel',
    'GET_BIKE_PACKAGE':'/get-parcel-driver',
    'CONFIRM_PARCEL_BOOKING':'/confirm-parcel-booking',
    'UPDATE_LANDMARK':'/update-landmark',
    'GET_BOOKINGDETAILS_FINAL_PAYMENT':'/bookingPaymentDetails/',
    'GET_TRIP_REPORTS':'/get-trips-report',
    'ADD_TRIP_DETAILS':'/add-trip',
    'GET_DRIVER_TRIP_DETAILS':'/get-trips',
    'GET_BOOKING_ENDED_DETAILS':'/booking-number',
    'SEARCH_BOOKINGS_BY_NUMBER':'/admin/customer/search',
    'GET_TRIP_BY_ID':'/trip/',
    'UPDATE_TRIP_DETAILS':'/update-trip',
    'BANNER_POSITION_UPDATE': '/banner/position/update',
    'DISTANCE_CHECKING': '/get-distance',
    'CITY_LIMIT_CHECKING':'/check-location',
    'EXPORT_EXCEL_CUSTOMER_DETAILS':'/admin/customers/export', 
    'POST_QUOTATION_LOG':'/quotation-log',
    'EXPORT_EXCEL_TRIP_DETAILS':'/admin/trips/export',
    'EXOTEL_CALL_LOGS': '/call-logs',
    'GET_CUSTOMER_NOTIFICATION':'/notification-messages',
    'POST_CUSTOMER_NOTIFICATION':'/notification-messages',
    'UPDATE_FOLLOWUP':'/booking/followup',
    'EXOTEL_CALL_LOGS': '/call-logs',
    'UPDATE_EXTRA_CHARGES':'/booking/extra-charges',
    'UPDATE_DRIVER_END_LOCATION':'/driver/end-location',
    'GET_WEBSITE_LEADS': '/website-leads',
    'GET_CUSTOM_ACTIVE_DISCOUNTS':'/discounts/custom-active',
    'GET_CUSTOM_DISCOUNT_TARGETS':'/discounts/targets',
    'POST_CUSTOM_DISCOUNT_TARGETS':'/discounts/targets',
    'POST_DRIVER_OFFER':'/driver-offers',
    'GET_DRIVER_OFFER':'/driver-offers',
    'POST_DRIVER_OFFER_ASSIGN':'/driver-offers/assign',
    'GET_DRIVER_OFFER_ASSIGN':'/driver-offers/assignments',
    'GET_DRIVER_ONLINE':'/drivers/online-count',
    'GET_DRIVERS_TRIP_COMPLETION':'/drivers/trip-completion',
    'GET_DRIVER_SERVICES_TRIP_DEMAND':'/drivers/trip-service-counts',
    'INDIVIDUAL_DRIVER_TARGET_ACHIEVEMENT' : '/drivers/target-achievements',
    'GET_DRIVER_AREA_TRIP_HRS' : '/drivers/area-hour-demand',
    'GET_DRIVER_AREA_TRIP_SHARE' : '/drivers/area-trip-share',
    'GENERATE_INVOICE': '/generate-invoice',
    'AUTO_MASTERPRICE_TABLE_ADD':'/add-autos-package',
    'ADD_DE_TIER': '/admin/partner-tier/rules',
    'EDIT_DE_TIER': '/admin/partner-tier/rules',
    'LIST_DE_TIER': '/admin/partner-tier/rules',
    'DRIVER_MONITORING_TIER':'/admin/partner-tier/monitoring',
    'DRIVER_MONITORING_TIER_HISTORY':'/admin/partner-tier/history',
    'INCENTIVE_PAYOUT' :'/admin/partner-tier/incentives',
    'INCENTIVE_PAYOUT_SUMMARY': '/admin/partner-tier/incentives/summary',
    'DE_AUDIT_LOG': '/admin/partner-tier/history',
    'DE_AUDIT_LOG_SUMMARY': '/admin/partner-tier/history/summary',
    'PARCEL_COMMISSION_STATE': '/admin/parcel-commission/state',
    'PARCEL_COMMISSION_HISTORY': '/admin/parcel-commission/history',
    'PARCEL_COMMISSION_SETTLE': '/admin/parcel-commission/settle',
    'PARCEL_COMMISSION_SETTLE_ALL': '/admin/parcel-commission/settle-all',
    'DRIVER_INCENTIVE':'/admin/partner-tier/incentive-components',
    'DRIVER_INCENTIVE_EDIT':'/admin/partner-tier/incentive-component',
    'DRIVER_INCENTIVE_STATUS':'/admin/partner-tier/incentive-component/status',
    'ADD_CASH_BACK':'/cashback-rules',
    'UPDATE_CASH_BACK':'/cashback-rules/:settingId',
    'GET_CASH_BACK':'/cashback-rules',
    'DRIVER_KM_INCENTIVE_RULES':'/admin/driver-km-incentive/rules',
    "GET_TRANSACTIONS_LIST":'/transactions',
    "GET_TRANSACTIONS_CHART":'/transactions/chart',
    "GET_BOOKING_FUNNEL": '/admin/booking-funnel',
    "ASSIGN_AUTO":'/confirm-auto-booking',
    "ADD_SUPPORT_PARCEL_BOOKING":'/add-support-parcel-booking',
    'DRIVER_RETURN_TRIP_DETAILS':'/admin/return-trips',
    'ADMIN_REQUIRED_DOCUMENTS': '/admin/verification/required-documents',
    'ADMIN_ONBOARDING_BY_ID': '/admin/account/onboarding/',
    'GET_ADMIN_BOOKINGS_SUMMARY': '/admin/bookings/summary',
    'GET_ADMIN_BOOKINGS_EVENTS': '/admin/bookings/events',
    'GET_DRIVER_CANCELLATION_LOGS': '/admin/driver-cancellation-logs',
    'GET_SKIP_EVENTS': '/admin/telemetry/skip-events',
    'VALIDATE_NOTIFICATION_TIME': '/validate-notification-time',
    'MASTER_SUB_PLAN_GROUP':'/admin/plan-group/logs',
    'SUPPORT_END_LOACTION':'/booking/end-location-reason',
    'GET_RETURN_TRIP_ELIGIBILITY': '/admin/return-trip-eligibility',
    'ADD_RETURN_TRIP_ELIGIBILITY': '/admin/return-trip-eligibility',
    'UPDATE_RETURN_TRIP_ELIGIBILITY': '/admin/return-trip-eligibility',
    'SUPPORT_TICKETS': '/admin/support-tickets',
    'SUPPORT_TICKET_BY_ID': '/admin/support-tickets/:id',
    'UPDATE_SUPPORT_TICKET_STATUS': '/admin/support-tickets/:id/status'

};

export const ADMIN_BOOKINGS_EVENTS_CANDIDATES = [
    API_ROUTES.GET_ADMIN_BOOKINGS_EVENTS,
    '/admin/bookings/event',
    '/admin/booking/events',
    '/admin/booking/event',
];

export const KYC_PROCESS = {
    AADHAAR: 'AADHAAR',
    PAN: 'PAN',
    LIVE_PHOTO: 'PHOTO',
    DRIVING_LICENSE: 'LICENSE',
    POLICE_CLEARANCE: 'POLICE_CLEARANCE',
    CONSENT_FORM: 'CONSENT_FORM',
    BANK_STATEMENT: 'PASSBOOK',
    RC_COPY: 'RC_COPY',
    INSURANCE: 'INSURANCE',
    PERMIT: 'PERMIT',
    VEHICLE_PHOTO: 'VEHICLE_PHOTO',
};

export const ASYNC_STORAGE_KEYS = {
    'TOKEN': 'token',
    'PHONE_NUMBER': 'phoneNumber',
    'LOCATION': 'location',
    'USER': 'user',
    'DEVICE_TOKEN': 'device_token',
    'PERMISSION_SUCCESS': 'permission_success'
};

export const BOOKING_STATUS = {
    QUOTED: 'QUOTED',
    BOOKING_ACCEPTED: 'BOOKING_ACCEPTED',
    INITIATED: 'INITIATED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    CUSTOMER_CANCELLED: 'CUSTOMER_CANCELLED',
    SUPPORT_CANCELLED: 'SUPPORT_CANCELLED',
    REQUEST_DRIVER: 'REQUEST_DRIVER',
    DRIVER_ON_THE_WAY: "DRIVER_ON_THE_WAY",
    DRIVER_REACHED: "DRIVER_REACHED",
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN PROGRESS',
    STARTED: 'STARTED',
    ASSIGNED_TO_SUPPORT: 'ASSIGNED_TO_SUPPORT',
    END_OTP:'END_OTP',
    PAYMENT_REQUESTED:'PAYMENT_REQUESTED',
    ENDED: 'ENDED',
    TRIP_ENDED: 'TRIP_ENDED',
};

export const BOOKING_SERVICE_TYPE = {
    DRIVER: 'DRIVER',
    RIDES: 'RIDES',
    CAB_BOOKING: 'CAB',
    CAR_WASH: 'CAR_WASH',
    RENTAL: 'RENTAL',
    AUTO: 'AUTO',
    PARCEL: 'PARCEL',
    ALL_CABS:'ALL_CABS',
    RETURN_TRIPS:'RETURN_TRIPS'
};

export const PUSH_NOTIFICATION_TYPE = {
    BOOKING_ACCEPTED: "BOOKING_ACCEPTED",
    BOOKING_REJECTED: "BOOKING_REJECTED",
    DRIVER_LOCATION: "DRIVER_LOCATION",
    DRIVER_ON_THE_WAY: "DRIVER_ON_THE_WAY",
    DRIVER_REACHED: "DRIVER_REACHED",
    STARTED: "STARTED",
    ENDED: "ENDED",
    ACCEPT_EXTENSION: "ACCEPT_EXTENSION",
    REJECT_EXTENSION: "REJECT_EXTENSION",
    REQUEST_DRIVER: "REQUEST_DRIVER",
    BASEPAYMENT_COMPLETED: "BASEPAYMENT_COMPLETED",
    EXTENSION_REQUEST: "EXTENSION_REQUEST",
    TRIP_ENDED: "TRIP_ENDED",
    PAYMENT_REQUESTED: "PAYMENT_REQUESTED"
};

export const USER = {
    ADMIN: 'ADMIN',
    CUSTOMER: 'CUSTOMER',
    DRIVER: 'DRIVER'
};
export const whatsappNumber = "9999999999";
export const whatsappMessage = "Hello, I would like to chat with you!";

export const supportNumber = "+91 860 860 6474";
export const supportEmail = "c4dsupport@texve.com";
export const supportMessage = `Welcome to Root Cabs.\n Please raise your query!`;

export const COMPANY_NAME = 'Root Cabs';
export const GST_NUMBER = '1234567890ABC';
export const GPAY_NUMBER = '8888888888';
export const GPAY_NAME = 'ROOT CABS PRIVATE LIMITED';

export const USER_ROLE = [
    { id: 'SUPER_USER', role: 'Super user' },
    { id: 'SALES', role: 'Sales' },
    { id: 'SUPPORT', role: 'Support' },
    { id: 'FINANCE', role: 'Finance' }
];

// Role-based permissions for main modules (side/top nav)
export const ROLE_PERMISSIONS = {
    'SUPER_USER': ['Home','Support','Driver Ops',"Calls", 'All bookings', 'Customers', 'Vendors', 'Trip Master','Finance', 'Document verification','Marketing', 'Users','Driver Engagement','Autos'],
    'SALES': ['Home','Support','Driver Ops','All bookings', 'Customers', 'Vendors', 'Document verification','Autos'],
    'SUPPORT': ['Home','Support','Calls','All bookings', 'Customers', 'Vendors','Autos'],
    'FINANCE': ['Home','Support','Driver Ops','All bookings', 'Customers', 'Vendors', 'Finance','Document verification','Autos'],
};

export const PERMISSION_GROUPS = {
    Support: ['Vendors','Document verification','Trip Master'],
    Users: ['Trip Master','Driver Engagement'],
};

export const expandPermissionsByGroup = (permissions = []) => {
    const expanded = new Set(permissions);
    permissions.forEach((permission) => {
        const extras = PERMISSION_GROUPS[permission];
        if (Array.isArray(extras)) {
            extras.forEach((extra) => expanded.add(extra));
        }
    });
    return Array.from(expanded);
};

export const applyPermissionSelection = (
    selectedPermissions = [],
    changedPermission = null,
    action = 'select'
) => {
    const next = new Set(selectedPermissions);
    const groups = Object.entries(PERMISSION_GROUPS);

    // Removing a parent should remove all its grouped children.
    if (action === 'remove' && changedPermission && PERMISSION_GROUPS[changedPermission]) {
        PERMISSION_GROUPS[changedPermission].forEach((child) => next.delete(child));
    }

    // Selecting a parent should add all of its grouped children.
    if (action === 'select' && changedPermission && PERMISSION_GROUPS[changedPermission]) {
        PERMISSION_GROUPS[changedPermission].forEach((child) => next.add(child));
    }

    // Selecting a child should ensure its parent is present.
    if (action === 'select' && changedPermission) {
        groups.forEach(([parent, children]) => {
            if (Array.isArray(children) && children.includes(changedPermission)) {
                next.add(parent);
            }
        });
    }

    return Array.from(next);
};

export const PERMISSION_OPTIONS = [
    { name: 'Home', id: 'Home' },
    { name: 'Support', id: 'Support' },
    { name: 'Driver Ops', id: 'Driver Ops' },
    { name: 'Calls', id: 'Calls'},
    { name: 'Autos', id: 'Autos'},
    { name: 'Driver Engagement', id: 'Driver Engagement'},
    { name: 'All bookings', id: 'All bookings' },
    { name: 'Customers', id: 'Customers' },
    { name: 'Vendors', id: 'Vendors' },
    { name:'Trip Master',id:'Trip Master'},
    { name: 'Finance', id: 'Finance' },
    { name: 'Document verification', id: 'Document verification' },
    { name: 'Marketing', id: 'Marketing' },
    { name: 'Users', id: 'Users' },
];

export const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'ACTIVE' },
    { value: 'IN_ACTIVE', label: 'INACTIVE' }
];

export const CAROUSEL_DATA = [
    {
        title: "Aenean leo",
        body: "Ut tincidunt tincidunt erat. Sed cursus turpis vitae tortor. Quisque malesuada placerat nisl. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
        imgUrl: "https://w0.peakpx.com/wallpaper/220/99/HD-wallpaper-new-york-yellow-taxi-street-skyscrapers-taxi-cab-usa-america-nyc.jpg",
    },
    {
        title: "In turpis",
        body: "Aenean ut eros et nisl sagittis vestibulum. Donec posuere vulputate arcu. Proin faucibus arcu quis ante. Curabitur at lacus ac velit ornare lobortis. ",
        imgUrl: "https://w0.peakpx.com/wallpaper/168/769/HD-wallpaper-new-york-street-yellow-taxi-winter-skyscrapers-usa-nyc-america.jpg",
    },
    {
        title: "Lorem Ipsum",
        body: "Phasellus ullamcorper ipsum rutrum nunc. Nullam quis ante. Etiam ultricies nisi vel augue. Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc.",
        imgUrl: "https://w0.peakpx.com/wallpaper/385/370/HD-wallpaper-new-york-city-street-traffic-jam-manhattan-nyc-traffic-new-york-usa-evening-city-america.jpg",
    },
];

export const WHATSAPP_FARE_QUOTATION_TEMPLATE =
    `${COMPANY_NAME} 
    Booking ID: \${bookingNumber}

    Hello \${customerName},
    Thank you for your interest in Root Cabs.
    Here's the fare quotation for your upcoming trip:

    Pickup: \${pickup}
    Drop: \${drop}
    Scheduled Date & Time: \${startDate} &  \${startTime}
    Vehicle Type: \${carType}
    Estimated Fare: ₹\${totalAmount}

    Please reply with 'CONFIRM' to proceed with this booking.

    For assistance, reach us at \${supportNumber}. Have a great day!

    Warm regards,
    ${COMPANY_NAME} Team`;

export const  WHATSAPP_BOOKING_CONFIRMED_TEMPLATE=
    `${COMPANY_NAME} 
    Booking ID: \${bookingNumber}

    Hello \${customerName},
    Your ride has been successfully booked with Root Cabs. Below are the details:

    Trip Details:
    Pickup: \${pickup}
    Drop: \${drop}
    Date: \${startDate}
    Time:  \${startTime}
    Start OTP: \${startOtp}
    Vehicle Type: \${carType}
    Fare: \${baseFare} \${packageRow}
    

    Driver details will be shared shortly.

    For assistance,reach us at \${supportNumber}. Have a great day!


   Warm regards,
   ${COMPANY_NAME} Team`;

export const  WHATSAPP_BOOKING_ACCEPTED=
    `${COMPANY_NAME}
    Booking ID: \${bookingNumber}

    Hello \${customerName},
    Your ride has been successfully booked with Root Cabs. Below are the details:

    Trip Details:
    Pickup: \${pickup}
    Drop: \${drop}
    Time:  \${startTime}
    Start OTP: \${startOtp}

    Vehicle Type: \${carType}
    Driver Name: \${driverName}
    
    For assistance,reach us at \${supportNumber}. Have a great day!

    Warm regards,
    ${COMPANY_NAME} Team`;

export const WHATSAPP_TRIP_STARTED=`
     ${COMPANY_NAME}  
     Booking ID: \${bookingNumber}

     Hello \${customerName},

     Your trip has now started. Please find the journey details below:
     Start OTP: \${startOtp}
     Pickup:\${pickup}
     Vehicle:\${carType}
     Driver Name:\${driverName}
     Start Time: \${startTime}

     For assistance,reach us at \${supportNumber}.

     Wish you a pleasant ride!

     Warm regards,
    ${COMPANY_NAME} Team`


export const  WHATSAPP_TRIP_COMPLETED=`
     ${COMPANY_NAME}  
     Booking ID: \${bookingNumber}

     Hello \${customerName},

     Thank you for chossing Root Cabs! Your trip with [Fleet/\${carType}] has been successfully completed.

     Trip Summary:
     • Pickup: \${pickup}
     • Drop: \${drop}
     • Start Time: \${startTime}
     • End Time: \${endTime}
     • End OTP: \${endOtp}
     • Package Duration:\${bookedDuration}
     • Extra Time: \${extraTime}
     • Extra Charges: ₹\${extraCharges}
     • Total Amount Paid: ₹\${totalAmount}
     
     For assistance, reach us at \${supportNumber}. Have a great day!

     We hope you had a great journey!

     Warm regards,
    ${COMPANY_NAME} Team`
    
    
export const WHATSAPP_BOOKING_CANCELLED=`
     ${COMPANY_NAME}  
     Booking ID: \${bookingNumber}

     Hello \${customerName},

     Your booking has been  cancelled as requested.

     Pickup: \${pickup}
     Scheduled Date & Time: \${startDate} &  \${startTime}

     We hope to serve you again soon. For rebooking, feel free to reach out us at \${supportNumber}

     Warm regards,
    ${COMPANY_NAME} Team`

    export const WHATSAPP_DRIVER_REACHED=
     `${COMPANY_NAME}
    Booking ID: \${bookingNumber}

    Hello \${customerName},
    Your driver has arrived at your pickup location. Please be ready to start.

    Trip Details:
    Pickup: \${pickup}
    Drop: \${drop}
    Time:  \${startTime}
    Start OTP: \${startOtp}

    Vehicle Type: \${carType}
    Driver Name: \${driverName}
    
    For assistance,reach us at \${supportNumber}. Have a great day!

    Warm regards,
    ${COMPANY_NAME} Team`;

export const BOOKING_TERMS_AND_CONDITIONS = "Price might vary at the end of trip closure, based on the other charges like parking, toll, trip extension & so.";
export const BOOKING_TERMS_AND_CONDITIONS_FOR_RIDES ="The price shown before confirming your ride is an approximate fare calculated using distance and travel time. Actual charges may differ due to factors like GPS signal quality, map accuracy, traffic conditions, network issues, or other technical limitations."
export const ColorStyles = {
    sidenavColors: "bg-primary-200",
    bgColor: "bg-primary",
    PopoverHandlerText: "text-black",
    bgStatusColor: " bg-primary text-white",
    addButtonColor: "bg-primary text-white",
    continueButtonColor: " bg-primary text-white",
    backButton: " text-black border-gray-400 border-2 rounded-xl bg-white",
    editButton: "bg-primary text-white",
};

export const NAV_UI = {
    colors: {
        sidebarBg: "bg-[#F3F4F6]",
        sidebarBorder: "border-[#E2E8F0]",
        sidebarActiveBg: "bg-[#DFF3EE]",
        sidebarActiveText: "text-[#0F766E]",
        sidebarInactiveText: "text-slate-600",
        topnavContainerBg: "bg-white",
        topnavActiveBg: "border-b-2 border-primary-500 bg-transparent",
        topnavActiveText: "text-[#0F766E] gap-2",
        topnavInactiveText: "text-slate-600 border-b-2 border-transparent",
    },
    typography: {
        sidebarLabel: "text-[15px] font-medium tracking-normal normal-case",
        topnavLabel: "text-[15px] font-medium tracking-normal normal-case",
    },
    iconSizes: {
        sidebar: "h-5 w-5",
        topnav: "h-[18px] w-[18px]",
    },
    radius: {
        item: "rounded-xl",
    },
    spacing: {
        sidebarButton: "py-3 pb-2",
        topnavButton: "px-2 py-2",
        topnavGap: "gap-2",
    },
    sidebar: {
        itemBase: "group flex items-center transition-colors duration-150",
        itemHover: "hover:bg-[#E9EEF2] hover:text-slate-700",
    },
    topnav: {
        list: "flex items-center gap-6 overflow-x-auto whitespace-nowrap py-0",
        buttonBase: "flex items-center transition-colors duration-150",
        buttonHover: "hover:bg-transparent hover:text-primary-600 hover:border-primary-300",
        nestedList: "ml-2 mt-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap",
        secondaryList: "mt-1 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-[#E2E8F0] pt-2",
    },
};
