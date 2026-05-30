const menus = {
    monday: [
        {name:"Latte", price:"$60", img:"https://placerydelirio.com/cdn/shop/files/LATTE-REGULAR-FOTOS-WEB-P_D.jpg?v=1749306244"},
        {name:"Cake", price:"$50", img:"https://sweetreservebakery.com/cdn/shop/files/BirthdayCakeGallery1.webp?v=1752999312"},
    ],
    
    tuesday: [
        {name:"Tea", price:"$40", img:"https://teashop.com/cdn/shop/articles/historia-del-chai-tea_520x500_b8d96e88-0ba4-42f8-a8b5-7f32118199eb.jpg?v=1734432684&width=2048"},
        {name:"Cookie", price:"$30", img:"https://yeyfood.com/wp-content/uploads/2025/02/WEB1clsoe_up_of_chocolate_chip_cookies._stacked_on_whi_07bc1482-455e-4c1a-969c-b0c7eaad50e1_3-720x720.jpg"},
   ],
    wednesday: [
        {name:"Hot Cocoa", price:"$35", img:"https://sugarspunrun.com/wp-content/uploads/2024/01/Hot-cocoa-recipe-1-of-1-2.jpg"},
        {name:"Brownie", price:"$45", img:"https://www.giallozafferano.es/images/288-28849/brownies-en-freidora-de-aire_1200x800.jpg"},
   ],
    thursday: [
        {name:"Mocha", price:"$65", img:"https://livinghealthywithchocolate.com/wp-content/uploads/2015/04/Healthy-Paleo-Starbucks-Mocha-Frappuccino-Recipe-dairyfree-glutenfree-sugarfree1.jpg"},
        {name:"Sandwich", price:"$70", img:"https://editorialtelevisa.brightspotcdn.com/a1/91/54ede86c4a7c89ee98f239261143/sandwich-saludable-para-lunch.jpeg"},
        
    ],
    friday: [
        {name:"Espresso", price:"$50", img:"https://www.novachef.es/media/images/espresso-macchiato.jpg"},
        {name:"Donut", price:"$40", img:"https://www.marketresearchintellect.com/images/blogs/best-doughnut-brands.webp"},
    ],
    saturday: [
        {name:"Cold Brew", price:"$75", img:"https://thecookinglab.es/wp-content/uploads/2025/12/como-hacer-cold-brew-500x500.jpg"},
        {name:"Waffle", price:"$80", img:"https://cravinghomecooked.com/wp-content/uploads/2019/02/easy-waffle-recipe-1-16.jpg"},
    ],
    sunday: [
        {name:"Milk Tea", price:"$55", img:"https://www.betterwithdairy.com/sites/default/files/2025-02/2_Boba-Milk-Tea.jpg"},
        {name:"Croissant", price:"$60", img:"https://www.cocinadelirante.com/800x600/filters:format(webp):quality(75)/sites/default/files/images/2025/04/croissant-relleno-jamon-serrano.jpg"},
    ]
};

// ===== MENU RENDERING =====
function changeMenu(day) {
    const menu = document.getElementById("menu");
    const label = document.getElementById("menu-day-label");
    menu.innerHTML = "";

    // Update active button state
    document.querySelectorAll("#day-buttons button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.day === day);
    });

    // Update day label
    const dayNames = {
        monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
        thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday"
    };
    label.textContent = `✨ ${dayNames[day]}'s specials`;

    // Render menu cards from database
    menus[day].forEach(item => {
        const div = document.createElement("div");
        div.className = "menu-card";
        div.innerHTML = `
            <h3>${item.name}</h3>
            <p class="price">${item.price}</p>
            <img src="${item.img}" alt="${item.name}">
        `;
        menu.appendChild(div);
    });
}

// ===== CAT RENDERING =====
function renderCats() {
    const container = document.getElementById("cats-container");
    container.innerHTML = "";
    catsDB.forEach(cat => {
        const card = document.createElement("div");
        card.className = "cat-card";
        card.innerHTML = `
            <img src="${cat.img}" alt="${cat.name}">
            <h3>${cat.name}</h3>
            <p class="cat-age">Age: ${cat.age}</p>
            <p class="cat-personality">${cat.personality}</p>
        `;
        container.appendChild(card);
    });
}


// ===== CATS DATABASE =====
const catsDB = [
  { name: "Bolillo", age: 2, personality: "Calm and loves sleeping", img: "https://img.pretty-online.jp/wp-content/uploads/2022/02/15135254/odekake_nekocafe_cattail_1.jpg"},
  { name: "Capuchino", age: 3, personality: "Very playful and curious", img: "https://things-niigata.jp/wp-content/uploads/2023/01/neko_main.jpg"},
  { name: "Croquetito", age: 1, personality: "Friendly and very active", img: "https://8machi.com/cdn/shop/products/nekohachi_12_800x.jpg?v=1622011584"},
  { name: "OlDon Bigotes',iver", age: 4, personality: "Quiet, elegant and wise", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhniOu3xvM2gNfTrtkiMhQ15CaGBw4EVDmhQ&s"},
  { name: "Pancracio", age: 2, personality: "Very affectionate and sweet", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsiaVviH-YDgfWYSsFsLviMRto_Fl4VxlVbA&s"}
];

// ===== INITIALISE: detect today's day =====
const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const today = dayMap[new Date().getDay()];
changeMenu(today);
renderCats();
