import { useState } from "react";
import { useNavigate } from "react-router-dom";

const WEBSITE_MENU = {
  sweets: [
    { id:"sw1", name:"Kaju Katli", emoji:"🍮", desc:"Pure cashew fudge pressed thin, dusted with edible silver leaf. Made fresh every morning.", price:80, unit:"100g", best:true },
    { id:"sw2", name:"Gulab Jamun", emoji:"🟤", desc:"Soft khoya dumplings soaked in rose-cardamom syrup. Each piece melts beautifully.", price:50, unit:"6 pcs", best:true },
    { id:"sw3", name:"Motichoor Ladoo", emoji:"🟠", desc:"Fine-grain boondi ladoos hand-rolled with roasted dry fruits, cardamom and saffron.", price:60, unit:"4 pcs", best:true },
    { id:"sw4", name:"Milk Barfi", emoji:"🍫", desc:"Rich milk solids reduced slowly with cardamom and crushed pistachios.", price:70, unit:"100g" },
    { id:"sw5", name:"Gajar Halwa", emoji:"🧡", desc:"Slow-cooked carrots in pure desi ghee, reduced with full-cream milk.", price:60, unit:"250g" },
    { id:"sw6", name:"Jalebi", emoji:"🌀", desc:"Crispy wheat spirals fried in ghee, soaked in warm saffron sugar syrup.", price:40, unit:"100g", best:true },
  ],
  cakes: [
    { id:"ck1", name:"Black Forest", emoji:"🎂", desc:"Dark chocolate sponge with whipped cream and cherry compote.", price:320, unit:"500g", best:true },
    { id:"ck2", name:"Butterscotch Delight", emoji:"🍰", desc:"Butterscotch cream frosting with crunchy praline pieces on top.", price:290, unit:"500g", best:true },
    { id:"ck3", name:"Red Velvet", emoji:"❤️", desc:"Velvety crimson sponge with cream cheese icing.", price:370, unit:"500g", best:true },
    { id:"ck4", name:"Chocolate Truffle", emoji:"🍫", desc:"Three layers of dark chocolate sponge with rich ganache and mirror glaze.", price:400, unit:"500g" },
    { id:"ck5", name:"Custom Cake", emoji:"🎨", desc:"Design your dream cake — size, flavour, decoration and message. 48-hour advance booking.", price:500, unit:"1 kg" },
  ],
  breakfast: [
    { id:"br1", name:"Kanda Poha", emoji:"🍛", desc:"Flattened rice with mustard, curry leaves, crispy sev and fresh lemon.", price:55, unit:"1 plate", best:true },
    { id:"br2", name:"Masala Dosa", emoji:"🫔", desc:"Crispy fermented crepe filled with spiced potato masala and chutneys.", price:100, unit:"1 pc", best:true },
    { id:"br3", name:"Idli Sambar", emoji:"🫓", desc:"4 soft steamed idlis with sambar and two chutneys.", price:75, unit:"4 pcs" },
    { id:"br4", name:"Masala Chai", emoji:"☕", desc:"Ginger-cardamom milk tea brewed strong, the old-school way.", price:20, unit:"1 cup", best:true },
  ],
};

const TABS = [
  { id:"sweets", label:"🍮 Sweets" },
  { id:"cakes", label:"🎂 Cakes" },
  { id:"breakfast", label:"🍳 Breakfast" },
];

export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState("sweets");
  const navigate = useNavigate();

  return (
    <div className="website-page">
      {/* NAV */}
      <nav className="ws-nav">
        <div className="ws-nav-logo">Bikaner Sweets</div>
        <button className="ws-nav-back" onClick={() => navigate(-1)}>← Back</button>
      </nav>

      {/* HERO */}
      <section className="ws-hero">
        <div className="ws-hero-bg" />
        <div className="ws-bokeh ws-bokeh-1" />
        <div className="ws-bokeh ws-bokeh-2" />
        <div className="ws-hero-content">
          <div className="ws-eyebrow">Est. 1996 · Kanhan, Nagpur</div>
          <h1 className="ws-hero-title">
            Nagpur's Most<br/>Loved <em>Mithai</em><br/>&amp; Restaurant
          </h1>
          <p className="ws-hero-sub">Where every bite carries 28 years of tradition — handcrafted sweets, freshly baked pastries &amp; warm breakfast made with love every morning.</p>
          <div className="ws-stats">
            <div className="ws-stat"><span>28+</span><label>Years of Trust</label></div>
            <div className="ws-stat-div"/>
            <div className="ws-stat"><span>50+</span><label>Varieties Daily</label></div>
            <div className="ws-stat-div"/>
            <div className="ws-stat"><span>4.8★</span><label>Rating</label></div>
            <div className="ws-stat-div"/>
            <div className="ws-stat"><span>500+</span><label>Orders/Day</label></div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="ws-section ws-about">
        <div className="ws-eyebrow-dark">Our Story</div>
        <h2 className="ws-section-title">A Legacy Sweetened Over Three Decades</h2>
        <div className="ws-divider"/>
        <div className="ws-story-grid">
          <div className="ws-story-visual">
            <div className="ws-story-card">🍮</div>
            <div className="ws-story-badge"><span>1996</span><small>Founded</small></div>
            <div className="ws-story-float"><span>500+</span><small>Daily Customers</small></div>
          </div>
          <div className="ws-story-text">
            <p>It began in 1996 when <strong>S.H. Agrawal</strong> opened a small sweet shop on J. N. Road, Kanhan — with a grandmother's recipe book and an unshakeable belief that food made with care needs no advertisement.</p>
            <p style={{marginTop:"16px"}}>Today, under <strong>Shubham Agrawal</strong>, the next generation carries that same flame — expanding into cakes, pastries, and a full breakfast menu while never compromising on the ingredients that built this legacy.</p>
            <div className="ws-pills">
              {["🥛 Fresh In-House Khoya","🌿 100% Vegetarian","🚫 No Artificial Colours","👨‍🍳 Family Recipes","🏆 28+ Years Trusted"].map(p=>(
                <span key={p} className="ws-pill">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MENU SHOWCASE */}
      <section className="ws-section ws-menu-showcase">
        <div className="ws-eyebrow-dark">Our Menu</div>
        <h2 className="ws-section-title">What Would You Like Today?</h2>
        <div className="ws-divider"/>

        <div className="ws-tabs">
          {TABS.map(t=>(
            <button key={t.id} className={`ws-tab ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="ws-menu-grid">
          {WEBSITE_MENU[activeTab]?.map(item=>(
            <div key={item.id} className="ws-menu-card">
              <div className="ws-menu-card-emoji">{item.emoji}</div>
              {item.best && <span className="ws-bestseller">★ Best Seller</span>}
              <div className="ws-menu-card-name">{item.name}</div>
              <div className="ws-menu-card-desc">{item.desc}</div>
              <div className="ws-menu-card-footer">
                <span className="ws-menu-price">₹{item.price}<small>/{item.unit}</small></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="ws-section ws-reviews">
        <div className="ws-eyebrow-dark">Customer Reviews</div>
        <div className="ws-reviews-header">
          <h2 className="ws-section-title">What Nagpur Says About Us</h2>
          <div className="ws-overall">
            <div className="ws-overall-num">4.8</div>
            <div>★★★★★</div>
            <div style={{fontSize:"12px",opacity:0.6}}>640+ reviews</div>
          </div>
        </div>
        <div className="ws-divider"/>
        <div className="ws-reviews-grid">
          {[
            { name:"Priya Bhosale", color:"#B91C1C", review:"The kaju katli here is on a completely different level. Soft, not too sweet, perfectly uniform. Nothing in Nagpur comes close.", item:"Kaju Katli, Motichoor Ladoo", date:"June 2026" },
            { name:"Rahul Deshmukh", color:"#15803D", review:"Ordered a custom chocolate truffle cake for my wife's birthday. Everyone at the party kept asking where it was from. Will order every year.", item:"Chocolate Truffle Cake (Custom)", date:"May 2026" },
            { name:"Sunita Agrawal", color:"#D4A017", review:"Their breakfast is my morning ritual. The poha is perfectly seasoned, masala chai has real cardamom flavour. ₹70 for a breakfast that makes your day.", item:"Poha, Masala Chai", date:"May 2026" },
          ].map((r,i)=>(
            <div key={i} className="ws-review-card">
              <div className="ws-review-head">
                <div className="ws-review-avatar" style={{background:r.color}}>{r.name[0]}</div>
                <div>
                  <div className="ws-review-name">{r.name}</div>
                  <div className="ws-review-stars">★★★★★</div>
                  <div className="ws-review-date">{r.date}</div>
                </div>
              </div>
              <p className="ws-review-text">"{r.review}"</p>
              <div className="ws-review-item">🛍 {r.item}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VISIT */}
      <section className="ws-section ws-visit">
        <div className="ws-eyebrow-dark">Visit Us</div>
        <h2 className="ws-section-title">Find Us in the Heart of Kanhan</h2>
        <div className="ws-divider"/>
        <div className="ws-info-grid">
          {[
            { icon:"📍", title:"Address", text:"J. N. Road, Kanhan, Nagpur\nMaharashtra — 441401" },
            { icon:"📞", title:"Phone", text:"+91 80074 70011\nCall to pre-order or bulk orders" },
            { icon:"🕐", title:"Hours", text:"Mon–Sat: 7 AM – 10 PM\nSun: 7 AM – 8 PM\nOpen on all festivals 🎉" },
            { icon:"💳", title:"Payment", text:"Cash · UPI (GPay, PhonePe)\nDebit & Credit Cards" },
          ].map((block, i) => (
            <div key={i} className="ws-info-block">
              <div className="ws-info-icon">{block.icon}</div>
              <div>
                <h4>{block.title}</h4>
                <p>{block.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ws-footer">
        <div className="ws-footer-brand">Bikaner Sweets & Restaurant</div>
        <p>Nagpur's most loved mithai house since 1996.</p>
        <div className="ws-footer-contact">
          <a href="tel:+918007470011">📞 +91 80074 70011</a>
          <a href="https://wa.me/918007470011">💬 WhatsApp</a>
        </div>
        <div className="ws-footer-copy">© 2026 Bikaner Sweets & Restaurant · Est. 1996 · Made with ❤️ for Kanhan, Nagpur</div>
      </footer>
    </div>
  );
}
