const catImages = {
    "Bolillo": "https://img.pretty-online.jp/wp-content/uploads/2022/02/15135254/odekake_nekocafe_cattail_1.jpg",
    "Capuchino": "https://things-niigata.jp/wp-content/uploads/2023/01/neko_main.jpg",
    "Croquetito": "https://8machi.com/cdn/shop/products/nekohachi_12_800x.jpg?v=1622011584",
    "Don Bigotes": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhniOu3xvM2gNfTrtkiMhQ15CaGBw4EVDmhQ&s",
    "Pancracio": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsiaVviH-YDgfWYSsFsLviMRto_Fl4VxlVbA&s"
};

const menuImages = {
    "Latte": "https://placerydelirio.com/cdn/shop/files/LATTE-REGULAR-FOTOS-WEB-P_D.jpg?v=1749306244",
    "Cake": "https://sweetreservebakery.com/cdn/shop/files/BirthdayCakeGallery1.webp?v=1752999312",
    "Tea": "https://teashop.com/cdn/shop/articles/historia-del-chai-tea_520x500_b8d96e88-0ba4-42f8-a8f5-7f32118199eb.jpg?v=1734432684&width=2048",
    "Cookie": "https://yeyfood.com/wp-content/uploads/2025/02/WEB1clsoe_up_of_chocolate_chip_cookies._stacked_on_whi_07bc1482-455e-4c1a-969c-b0c7eaad50e1_3-720x720.jpg",
    "Hot Cocoa": "https://sugarspunrun.com/wp-content/uploads/2024/01/Hot-cocoa-recipe-1-of-1-2.jpg",
    "Brownie": "https://www.giallozafferano.es/images/288-28849/brownies-en-freidora-de-aire_1200x800.jpg",
    "Mocha": "https://livinghealthywithchocolate.com/wp-content/uploads/2015/04/Healthy-Paleo-Starbucks-Mocha-Frappuccino-Recipe-dairyfree-glutenfree-sugarfree1.jpg",
    "Sandwich": "https://editorialtelevisa.brightspotcdn.com/a1/91/54ede86c4a7c89ee98f239261143/sandwich-saludable-para-lunch.jpeg",
    "Espresso": "https://www.novachef.es/media/images/espresso-macchiato.jpg",
    "Donut": "https://www.marketresearchintellect.com/images/blogs/best-doughnut-brands.webp",
    "Cold Brew": "https://thecookinglab.es/wp-content/uploads/2025/12/como-hacer-cold-brew-500x500.jpg",
    "Waffle": "https://cravinghomecooked.com/wp-content/uploads/2019/02/easy-waffle-recipe-1-16.jpg",
    "Milk Tea": "https://www.betterwithdairy.com/sites/default/files/2025-02/2_Boba-Milk-Tea.jpg",
    "Croissant": "https://www.cocinadelirante.com/800x600/filters:format(webp):quality(75)/sites/default/files/images/2025/04/croissant-relleno-jamon-serrano.jpg"
};

async function changeMenu(day) {

    const map = {
        monday: "Mon",
        tuesday: "Tue",
        wednesday: "Wed",
        thursday: "Thu",
        friday: "Fri",
        saturday: "Sat",
        sunday: "Sun"
    };

    const response =
        await fetch(
            `/api/menu/${map[day]}`
        );

    const items =
        await response.json();

    const menu =
        document.getElementById("menu");

    menu.innerHTML = "";

    items.forEach(item => {

        const div =
            document.createElement("div");

        div.className = "menu-card";

        div.innerHTML = `
            <h3>${item.item}</h3>
            <p class="price">$${item.price}</p>
            <img src="${menuImages[item.item]}" alt="${item.item}">
        `;

        menu.appendChild(div);
    });
}

// ===== CAT RENDERING =====
async function renderCats() {

    const response =
        await fetch("/api/cats");

    const cats =
        await response.json();

    const container =
        document.getElementById("cats-container");

    container.innerHTML = "";

    cats.forEach(cat => {

        const card =
            document.createElement("div");

        card.className = "cat-card";

        card.innerHTML = `
        <img src="${catImages[cat.name]}" alt="${cat.name}">
        <h3>${cat.name}</h3>
        <p class="cat-age">Age: ${cat.age}</p>
        <p class="cat-personality">${cat.personality}</p>
        `;

        container.appendChild(card);
    });
}




// ===== INITIALISE: detect today's day =====
const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const today = dayMap[new Date().getDay()];
changeMenu(today);
renderCats();
