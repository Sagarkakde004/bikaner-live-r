export const MENU_CATEGORIES = [
  { id: "starters",   label: "Starters",    emoji: "🔥" },
  { id: "main",       label: "Main Course", emoji: "🍛" },
  { id: "biryani",    label: "Biryani",     emoji: "🍚" },
  { id: "breads",     label: "Breads",      emoji: "🫓" },
  { id: "desserts",   label: "Desserts",    emoji: "🍮" },
  { id: "drinks",     label: "Drinks",      emoji: "☕" },
];

export const MENU_ITEMS = [
  // STARTERS
  { id: 1,  category: "starters", name: "Paneer Tikka",          desc: "Tandoor-grilled cottage cheese with spiced yogurt marinade & mint chutney",    price: 199, emoji: "🔥", tags: ["veg", "popular"],  veg: true  },
  { id: 2,  category: "starters", name: "Chicken Seekh Kebab",   desc: "Minced chicken skewers with fresh herbs, aromatic spices & onion rings",        price: 229, emoji: "🍢", tags: ["spicy"],            veg: false },
  { id: 3,  category: "starters", name: "Veg Spring Rolls",      desc: "Crispy golden rolls filled with spiced seasonal vegetables",                    price: 149, emoji: "🥢", tags: ["veg"],             veg: true  },
  { id: 4,  category: "starters", name: "Crispy Calamari",       desc: "Golden-fried rings with house garlic aioli and lemon wedge",                    price: 249, emoji: "🦑", tags: ["spicy"],            veg: false },
  { id: 5,  category: "starters", name: "Hara Bhara Kabab",      desc: "Spinach, peas and potato tikkis pan-fried to a golden crust",                   price: 169, emoji: "🌿", tags: ["veg", "popular"],  veg: true  },

  // MAIN COURSE
  { id: 6,  category: "main", name: "Butter Chicken",            desc: "Tender chicken in rich, creamy tomato-butter sauce with fenugreek",              price: 319, emoji: "🍛", tags: ["popular", "spicy"], veg: false },
  { id: 7,  category: "main", name: "Paneer Makhani",            desc: "Soft paneer cubes in silky butter-tomato-cream gravy",                          price: 289, emoji: "🫕", tags: ["veg", "popular"],   veg: true  },
  { id: 8,  category: "main", name: "Dal Makhani",               desc: "Slow-cooked black lentils with cream and butter — 12-hour simmer",               price: 219, emoji: "🫘", tags: ["veg"],              veg: true  },
  { id: 9,  category: "main", name: "Lamb Rogan Josh",           desc: "Slow-braised lamb in aromatic Kashmiri spices and whole cardamom",               price: 379, emoji: "🥘", tags: ["spicy"],             veg: false },
  { id: 10, category: "main", name: "Fish Curry",                desc: "Fresh river fish in tangy coconut-based Goan curry",                            price: 349, emoji: "🐟", tags: [],                    veg: false },
  { id: 11, category: "main", name: "Shahi Paneer",              desc: "Paneer in a royal Mughal-style cashew-cream gravy with saffron",                 price: 299, emoji: "👑", tags: ["veg", "popular"],   veg: true  },

  // BIRYANI
  { id: 12, category: "biryani", name: "Chicken Dum Biryani",    desc: "Aged basmati slow-cooked with tender chicken, saffron and fried onions",         price: 299, emoji: "🍚", tags: ["popular", "spicy"], veg: false },
  { id: 13, category: "biryani", name: "Veg Biryani",            desc: "Fragrant basmati with seasonal vegetables, whole spices and rose water",         price: 229, emoji: "🌿", tags: ["veg"],              veg: true  },
  { id: 14, category: "biryani", name: "Mutton Biryani",         desc: "Tender mutton with aged basmati, dum-cooked to smoky perfection",                price: 349, emoji: "🍖", tags: ["popular", "spicy"], veg: false },
  { id: 15, category: "biryani", name: "Paneer Biryani",         desc: "Cottage cheese marinated in saffron, layered with basmati and caramelized onions", price: 259, emoji: "🧀", tags: ["veg"],             veg: true  },

  // BREADS
  { id: 16, category: "breads", name: "Butter Naan",             desc: "Soft leavened bread baked in tandoor, finished with salted butter",              price: 49,  emoji: "🫓", tags: ["veg"],              veg: true  },
  { id: 17, category: "breads", name: "Garlic Naan",             desc: "Naan topped with garlic butter, fresh coriander and nigella seeds",              price: 59,  emoji: "🧄", tags: ["veg", "popular"],   veg: true  },
  { id: 18, category: "breads", name: "Stuffed Paratha",         desc: "Flaky whole-wheat flatbread stuffed with spiced aloo, served with curd",         price: 79,  emoji: "🥙", tags: ["veg"],              veg: true  },
  { id: 19, category: "breads", name: "Laccha Paratha",          desc: "Multi-layered flaky paratha, each layer crisp and buttery",                      price: 55,  emoji: "🌀", tags: ["veg"],              veg: true  },

  // DESSERTS
  { id: 20, category: "desserts", name: "Gulab Jamun",           desc: "Soft khoya dumplings soaked in rose-cardamom syrup — served warm",               price: 99,  emoji: "🍮", tags: ["veg", "popular"],   veg: true  },
  { id: 21, category: "desserts", name: "Kulfi Falooda",         desc: "Traditional ice cream with vermicelli, basil seeds and rose syrup",               price: 129, emoji: "🍨", tags: ["veg"],              veg: true  },
  { id: 22, category: "desserts", name: "Chocolate Lava Cake",   desc: "Warm dark chocolate cake with molten centre and vanilla ice cream",               price: 159, emoji: "🍫", tags: ["popular"],           veg: true  },
  { id: 23, category: "desserts", name: "Rasmalai",              desc: "Spongy cottage cheese discs in chilled saffron-cardamom milk",                   price: 109, emoji: "🥛", tags: ["veg", "popular"],   veg: true  },

  // DRINKS
  { id: 24, category: "drinks", name: "Mango Lassi",             desc: "Chilled curd blended with ripe Alphonso mango and honey",                        price: 89,  emoji: "🥭", tags: ["veg", "popular"],   veg: true  },
  { id: 25, category: "drinks", name: "Masala Chai",             desc: "Aromatic spiced tea brewed slowly with full-cream milk and ginger",               price: 49,  emoji: "☕", tags: ["veg"],              veg: true  },
  { id: 26, category: "drinks", name: "Fresh Lime Soda",         desc: "Chilled lime with mint — sweet, salted or both",                                  price: 69,  emoji: "🍋", tags: ["veg"],              veg: true  },
  { id: 27, category: "drinks", name: "Bikaner Special Shake",   desc: "House blend of rose, pistachio and chilled cream — our signature drink",         price: 129, emoji: "🌹", tags: ["popular", "veg"],   veg: true  },
  { id: 28, category: "drinks", name: "Cold Coffee",             desc: "Espresso blended with ice cream and milk — thick and velvety",                   price: 99,  emoji: "🧊", tags: ["popular"],           veg: true  },
];
