import { useEffect } from "react";
import "./App.css";

const CHAT_API_BASE = "https://crystal-dental-chatbot-backend.vercel.app";
const CHAT_SESSION_KEY = "dentalux_chat_session_id";

const pageMarkup = `<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cursorRing"></div>

<!-- NAVBAR -->
<nav id="navbar">
  <a href="#" class="logo">
    <div class="logo-icon">🦷</div>
    <span class="logo-text">Denta<span>Lux</span></span>
  </a>
  <ul>
    <li><a href="#services">Services</a></li>
    <li><a href="#why">About</a></li>
    <li><a href="#team">Team</a></li>
    <li><a href="#testimonials">Reviews</a></li>
    <li><a href="#booking">Contact</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:16px;">
    <div class="lang-switcher">
      <button class="lang-btn active" onclick="setLang('en')">EN</button>
      <button class="lang-btn" onclick="setLang('hu')">HU</button>
      <button class="lang-btn" onclick="setLang('fr')">FR</button>
    </div>
    <a href="#booking" class="nav-cta">Book Now</a>
  </div>
</nav>

<!-- HERO -->
<section id="hero">
  <div class="hero-bg-image"></div>
  <div class="hero-bg-overlay"></div>
  <div class="hero-glow hero-glow-left"></div>
  <div class="hero-glow hero-glow-right"></div>

  <div class="hero-shell">
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        <span data-i18n="hero_badge">Now Accepting New Patients</span>
      </div>
      <h1 class="hero-title">
        <span data-i18n="hero_title1">Your Perfect</span>
        <em data-i18n="hero_title2">Smile Awaits</em>
        <span data-i18n="hero_title3">You Here</span>
      </h1>
      <p class="hero-desc" data-i18n="hero_desc">World-class dental care with cutting-edge technology. From routine check-ups to full smile transformations — we speak your language and care for your smile.</p>
      <div class="hero-actions">
        <a href="#booking" class="btn-primary">
          📅 <span data-i18n="hero_cta1">Book Appointment</span>
        </a>
        <a href="#services" class="btn-secondary">
          <span class="play-icon">▶</span>
          <span data-i18n="hero_cta2">Explore Services</span>
        </a>
      </div>
      <div class="hero-stats">
        <div class="stat"><h3>12K+</h3><p data-i18n="stat1">Happy Patients</p></div>
        <div class="stat"><h3>98%</h3><p data-i18n="stat2">Satisfaction Rate</p></div>
        <div class="stat"><h3>15+</h3><p data-i18n="stat3">Years Experience</p></div>
        <div class="stat"><h3>3</h3><p data-i18n="stat4">Languages Supported</p></div>
      </div>
    </div>

    <div class="hero-visual reveal">
      <div class="hero-panel">
        <div class="hero-panel-label">Signature Clinic Experience</div>
        <div class="hero-panel-title">Luxury Dental Lounge</div>
        <p>Digital diagnostics, private treatment suites, and concierge-level care from your first visit.</p>
      </div>
      <div class="hero-float-card hero-float-top">
        <div class="float-card-inner">
          <div class="float-icon">⭐</div>
          <div>
            <div class="float-label">Patient Rating</div>
            <div class="float-value">4.9 / 5.0</div>
            <div class="stars">★★★★★</div>
          </div>
        </div>
      </div>
      <div class="hero-float-card hero-float-bottom">
        <div class="float-card-inner">
          <div class="float-icon">🤖</div>
          <div>
            <div class="float-label">AI Chatbot</div>
            <div class="float-value">Online 24/7</div>
          </div>
        </div>
      </div>
      <div>
        <a class="hero-mini-cta" href="#booking">Get Personalized Plan</a>
      </div>
    </div>
  </div>
</section>

<!-- MARQUEE -->
<div class="marquee-wrap">
  <div class="marquee-track" id="marqueeTrack">
    <span class="marquee-item"><span>🦷</span> Teeth Whitening <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>💎</span> Veneers <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🔬</span> Implants <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>😁</span> Orthodontics <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🌟</span> Cosmetic Dentistry <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🏥</span> Emergency Care <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>👶</span> Pediatric Dentistry <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🦷</span> Teeth Whitening <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>💎</span> Veneers <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🔬</span> Implants <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>😁</span> Orthodontics <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🌟</span> Cosmetic Dentistry <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>🏥</span> Emergency Care <span class="marquee-dot"></span></span>
    <span class="marquee-item"><span>👶</span> Pediatric Dentistry <span class="marquee-dot"></span></span>
  </div>
</div>

<!-- SERVICES -->
<section id="services">
  <div class="services-header reveal">
    <div>
      <div class="section-label">What We Offer</div>
      <h2 class="section-title">Premium <span>Dental Services</span><br>For Every Need</h2>
    </div>
    <p class="section-desc" style="max-width:340px;">State-of-the-art treatments tailored to you. Ask our AI chatbot about pricing anytime.</p>
  </div>
  <div class="services-grid">
    <div class="service-card reveal">
      <div class="service-icon">🦷</div>
      <div class="service-num">01 / Service</div>
      <div class="service-name">Teeth Whitening</div>
      <div class="service-desc">Professional laser whitening that brightens your smile up to 10 shades in a single session.</div>
      <div class="service-footer">
        <div><div class="service-price-label">From</div><div class="service-price">€120</div></div>
        <span class="service-tag">Most Popular</span>
      </div>
    </div>
    <div class="service-card featured reveal">
      <div class="service-icon" style="background:rgba(10,22,40,0.15)">💎</div>
      <div class="service-num">02 / Service</div>
      <div class="service-name">Porcelain Veneers</div>
      <div class="service-desc">Ultra-thin ceramic shells crafted to perfection. Reshape, whiten, and correct in one treatment.</div>
      <div class="service-footer">
        <div><div class="service-price-label">From</div><div class="service-price" style="color:var(--navy)">€350</div></div>
        <span class="service-tag">⭐ Premium</span>
      </div>
    </div>
    <div class="service-card reveal">
      <div class="service-icon">🔬</div>
      <div class="service-num">03 / Service</div>
      <div class="service-name">Dental Implants</div>
      <div class="service-desc">Titanium root implants that look, feel and function like natural teeth. Lifetime solution.</div>
      <div class="service-footer">
        <div><div class="service-price-label">From</div><div class="service-price">€800</div></div>
        <span class="service-tag">Permanent</span>
      </div>
    </div>
    <div class="service-card reveal">
      <div class="service-icon">😁</div>
      <div class="service-num">04 / Service</div>
      <div class="service-name">Orthodontics</div>
      <div class="service-desc">Invisible aligners and traditional braces to give you perfectly straight teeth discreetly.</div>
      <div class="service-footer">
        <div><div class="service-price-label">From</div><div class="service-price">€1,200</div></div>
        <span class="service-tag">Invisible</span>
      </div>
    </div>
    <div class="service-card reveal">
      <div class="service-icon">🏥</div>
      <div class="service-num">05 / Service</div>
      <div class="service-name">Emergency Care</div>
      <div class="service-desc">Same-day appointments for dental emergencies. Pain relief guaranteed within 30 minutes of arrival.</div>
      <div class="service-footer">
        <div><div class="service-price-label">From</div><div class="service-price">€80</div></div>
        <span class="service-tag">24h Available</span>
      </div>
    </div>
    <div class="service-card reveal">
      <div class="service-icon">✨</div>
      <div class="service-num">06 / Service</div>
      <div class="service-name">Smile Makeover</div>
      <div class="service-desc">Full smile transformation combining multiple treatments for a complete, stunning new you.</div>
      <div class="service-footer">
        <div><div class="service-price-label">From</div><div class="service-price">€2,500</div></div>
        <span class="service-tag">Complete</span>
      </div>
    </div>
  </div>
</section>

<!-- WHY US -->
<section id="why">
  <div class="why-image-wrap reveal">
    <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop" alt="Our Clinic">
    <div class="why-image-overlay"></div>
    <div class="why-badge-card">
      <div class="why-badge-title">✅ Why Choose DentaLux</div>
      <ul class="why-checklist">
        <li>No hidden costs — transparent pricing</li>
        <li>AI chatbot in English, Hungarian & French</li>
        <li>Same-day emergency appointments</li>
        <li>International patient support</li>
      </ul>
    </div>
  </div>
  <div>
    <div class="section-label reveal">Why DentaLux</div>
    <h2 class="section-title reveal">The Standard <span>Others</span><br>Aspire To</h2>
    <div class="why-features" style="margin-top:48px;">
      <div class="why-feature reveal">
        <div class="why-feat-icon">🤖</div>
        <div>
          <div class="why-feat-title">AI-Powered Smart Chatbot</div>
          <div class="why-feat-desc">Describe your symptoms — our AI suggests the right service instantly. Available in English, Hungarian and French, 24/7.</div>
        </div>
      </div>
      <div class="why-feature reveal">
        <div class="why-feat-icon">🌍</div>
        <div>
          <div class="why-feat-title">Multilingual Support</div>
          <div class="why-feat-desc">We serve patients in 3 languages. Our staff and AI assistant are fully equipped to communicate fluently with you.</div>
        </div>
      </div>
      <div class="why-feature reveal">
        <div class="why-feat-icon">🏆</div>
        <div>
          <div class="why-feat-title">Award-Winning Expertise</div>
          <div class="why-feat-desc">15+ years of excellence. Our team uses only the latest FDA-approved materials and cutting-edge digital imaging.</div>
        </div>
      </div>
      <div class="why-feature reveal">
        <div class="why-feat-icon">📅</div>
        <div>
          <div class="why-feat-title">Effortless Booking</div>
          <div class="why-feat-desc">Book in seconds via chatbot, online form, or phone. We confirm your appointment within minutes.</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- TEAM -->
<section id="team">
  <div class="section-label reveal">Our Experts</div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:20px;">
    <h2 class="section-title reveal">Meet Your <span>Care Team</span></h2>
    <p class="section-desc reveal" style="margin-top:0;">Board-certified specialists with decades of combined experience.</p>
  </div>
  <div class="team-grid">
    <div class="team-card reveal">
      <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&auto=format&fit=crop" alt="Dr. Kovács Anna">
      <div class="team-overlay"></div>
      <div class="team-info">
        <div class="team-name">Dr. Kovács Anna</div>
        <div class="team-role">Lead Orthodontist</div>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop" alt="Dr. Martin Dupont">
      <div class="team-overlay"></div>
      <div class="team-info">
        <div class="team-name">Dr. Martin Dupont</div>
        <div class="team-role">Cosmetic Dentist</div>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop" alt="Dr. Sarah Williams">
      <div class="team-overlay"></div>
      <div class="team-info">
        <div class="team-name">Dr. Sarah Williams</div>
        <div class="team-role">Implant Specialist</div>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop" alt="Dr. Nagy Péter">
      <div class="team-overlay"></div>
      <div class="team-info">
        <div class="team-name">Dr. Nagy Péter</div>
        <div class="team-role">Endodontist</div>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testimonials">
  <div class="testimonials-header">
    <div>
      <div class="section-label reveal">Patient Reviews</div>
      <h2 class="section-title reveal">Real <span>Smiles,</span><br>Real Stories</h2>
    </div>
    <div style="text-align:right;" class="reveal">
      <div style="font-family:'Playfair Display',serif;font-size:64px;font-weight:900;color:var(--gold);">4.9</div>
      <div class="stars" style="font-size:18px;">★★★★★</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Based on 2,400+ reviews</div>
    </div>
  </div>
  <div class="testimonials-grid">
    <div class="testimonial-card large reveal">
      <div class="quote-mark">"</div>
      <div class="testimonial-text">I was terrified of dentists my whole life, but the team at DentaLux completely changed that. The AI chatbot helped me understand my options in Hungarian before I even walked in. The veneers are absolutely stunning — I can't stop smiling.</div>
      <div class="testimonial-stars">★★★★★</div>
      <div class="testimonial-author">
        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop" alt="Petra" class="author-avatar">
        <div>
          <div class="author-name">Horváth Petra</div>
          <div class="author-location">Budapest, Hungary 🇭🇺</div>
        </div>
      </div>
    </div>
    <div class="testimonial-card reveal">
      <div class="quote-mark">"</div>
      <div class="testimonial-text">J'ai utilisé le chatbot en français pour obtenir des informations sur les implants. Le service était impeccable et les résultats dépassent mes attentes.</div>
      <div class="testimonial-stars">★★★★★</div>
      <div class="testimonial-author">
        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop" alt="Jean-Pierre" class="author-avatar">
        <div>
          <div class="author-name">Jean-Pierre Moreau</div>
          <div class="author-location">Paris, France 🇫🇷</div>
        </div>
      </div>
    </div>
    <div class="testimonial-card reveal">
      <div class="quote-mark">"</div>
      <div class="testimonial-text">Best dental experience of my life. Described my tooth pain to the chatbot at 2am and it instantly suggested emergency care. Got an appointment first thing next morning.</div>
      <div class="testimonial-stars">★★★★★</div>
      <div class="testimonial-author">
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop" alt="James" class="author-avatar">
        <div>
          <div class="author-name">James Thompson</div>
          <div class="author-location">London, UK 🇬🇧</div>
        </div>
      </div>
    </div>
    <div class="testimonial-card reveal">
      <div class="quote-mark">"</div>
      <div class="testimonial-text">The smile makeover transformed my confidence entirely. Professional team, transparent pricing, and the AI chatbot answered all my questions before my consultation.</div>
      <div class="testimonial-stars">★★★★★</div>
      <div class="testimonial-author">
        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop" alt="Sofia" class="author-avatar">
        <div>
          <div class="author-name">Sofia Berlinger</div>
          <div class="author-location">Vienna, Austria 🇦🇹</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- BOOKING -->
<section id="booking">
  <div class="booking-inner reveal">
    <div class="section-label" style="justify-content:center;">Get Started</div>
    <h2 class="section-title" style="max-width:100%;text-align:center;">Book Your <span>Free</span><br>Consultation Today</h2>
    <p class="section-desc" style="margin:20px auto 0;text-align:center;">No commitment needed. Our team will confirm within 2 hours.</p>
    <form class="booking-form" onsubmit="handleBooking(event)">
      <input class="booking-input" type="text" placeholder="Your full name" id="bName">
      <input class="booking-input" type="email" placeholder="Email address" id="bEmail" style="border-left:1px solid rgba(255,255,255,0.1)">
      <select class="booking-select" id="bService">
        <option value="">Select Service</option>
        <option>Teeth Whitening</option>
        <option>Veneers</option>
        <option>Implants</option>
        <option>Orthodontics</option>
        <option>Emergency Care</option>
        <option>Consultation</option>
      </select>
      <button type="submit" class="booking-submit">Book Free →</button>
    </form>
    <p class="booking-note">🔒 Your information is 100% private. We will never share your data.</p>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-top">
    <div class="footer-brand">
      <a href="#" class="logo">
        <div class="logo-icon">🦷</div>
        <span class="logo-text">Denta<span>Lux</span></span>
      </a>
      <p>Premium dental care in the heart of the city. Serving patients in English, Hungarian, and French since 2009.</p>
      <div class="footer-socials">
        <a href="#" class="social-btn">f</a>
        <a href="#" class="social-btn">in</a>
        <a href="#" class="social-btn">ig</a>
        <a href="#" class="social-btn">📧</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      <ul>
        <li><a href="#">Teeth Whitening</a></li>
        <li><a href="#">Veneers</a></li>
        <li><a href="#">Implants</a></li>
        <li><a href="#">Orthodontics</a></li>
        <li><a href="#">Emergency</a></li>
        <li><a href="#">Smile Makeover</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Clinic</h4>
      <ul>
        <li><a href="#">About Us</a></li>
        <li><a href="#">Our Team</a></li>
        <li><a href="#">Technology</a></li>
        <li><a href="#">Testimonials</a></li>
        <li><a href="#">Blog</a></li>
        <li><a href="admin.html">Admin Panel</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <ul>
        <li><a href="#">📍 Budapest, Hungary</a></li>
        <li><a href="#">📞 +36 1 234 5678</a></li>
        <li><a href="#">📧 hello@dentalux.com</a></li>
        <li><a href="#">⏰ Mon–Sat: 8am–8pm</a></li>
        <li><a href="#">🚨 Emergency: 24/7</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2025 <span>DentaLux Clinic</span>. All rights reserved.</p>
    <p>Powered by <span>AI Chatbot</span> · EN · HU · FR</p>
  </div>
</footer>

<!-- CHATBOT BUTTON -->
<button id="chat-btn" onclick="toggleChat()">
  <div class="pulse-ring"></div>
  🤖
</button>

<!-- CHATBOT WINDOW -->
<div id="chat-window">
  <div class="chat-header">
    <div class="chat-avatar">🦷</div>
    <div class="chat-header-info">
      <div class="chat-header-name">DentaLux AI Assistant</div>
      <div class="chat-header-status">Online — Typically replies instantly</div>
    </div>
    <select class="chat-lang-select" id="chatLang" onchange="changeChatLang()">
      <option value="en">🇬🇧 EN</option>
      <option value="hu">🇭🇺 HU</option>
      <option value="fr">🇫🇷 FR</option>
    </select>
    <button class="chat-close" onclick="toggleChat()">✕</button>
  </div>

  <div class="chat-messages" id="chatMessages">
    <div class="msg bot">
      <div class="msg-avatar">🦷</div>
      <div class="msg-bubble" id="welcomeMsg">Hello! 👋 I'm your DentaLux AI assistant. Tell me about your dental concerns or ask about our services and pricing — I'll suggest the right treatment for you!</div>
    </div>
  </div>

  <div class="chat-chips" id="chatChips">
    <div class="chip" onclick="sendChip(this)">🦷 Toothache</div>
    <div class="chip" onclick="sendChip(this)">✨ Whitening</div>
    <div class="chip" onclick="sendChip(this)">💎 Veneers</div>
    <div class="chip" onclick="sendChip(this)">💰 Pricing</div>
    <div class="chip" onclick="sendChip(this)">📅 Book Now</div>
  </div>

  <div class="chat-input-wrap">
    <input type="text" id="chat-input" placeholder="Type your message..." onkeydown="if(event.key==='Enter')sendMessage()">
    <button id="chat-send" onclick="sendMessage()">➤</button>
  </div>
</div>`;

function App() {
  useEffect(() => {
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    const navbar = document.getElementById("navbar");
    const chatWindow = document.getElementById("chat-window");
    const chatButton = document.getElementById("chat-btn");
    const chatInput = document.getElementById("chat-input");
    const chatLang = document.getElementById("chatLang");
    const welcomeMsg = document.getElementById("welcomeMsg");
    const chatMessages = document.getElementById("chatMessages");
    const chatChips = document.getElementById("chatChips");
    const bookingForm = document.querySelector(".booking-form");

    if (!cursor || !ring || !navbar || !chatWindow || !chatButton || !chatInput || !chatLang || !welcomeMsg || !chatMessages || !chatChips || !bookingForm) {
      return undefined;
    }

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let chatOpen = false;
    let ringFrame = 0;

    const translations = {
      en: {
        hero_badge: "Now Accepting New Patients",
        hero_title1: "Your Perfect",
        hero_title2: "Smile Awaits",
        hero_title3: "You Here",
        hero_desc: "World-class dental care with cutting-edge technology. From routine check-ups to full smile transformations — we speak your language.",
        hero_cta1: "Book Appointment",
        hero_cta2: "Explore Services",
        stat1: "Happy Patients",
        stat2: "Satisfaction Rate",
        stat3: "Years Experience",
        stat4: "Languages Supported",
        chat_welcome: "Hello! 👋 I'm your DentaLux AI assistant. Tell me about your dental concerns or ask about our services and pricing — I'll suggest the right treatment for you!"
      },
      hu: {
        hero_badge: "Új betegeket fogadunk",
        hero_title1: "A tökéletes",
        hero_title2: "Mosoly Vár",
        hero_title3: "Önre itt",
        hero_desc: "Világszínvonalú fogászati ellátás élvonalbeli technológiával. A rutinvizsgálatoktól a teljes mosolytranszformációig — az Ön nyelvén.",
        hero_cta1: "Időpontfoglalás",
        hero_cta2: "Szolgáltatásaink",
        stat1: "Elégedett Páciens",
        stat2: "Elégedettségi Arány",
        stat3: "Éves Tapasztalat",
        stat4: "Támogatott Nyelv",
        chat_welcome: "Szia! 👋 A DentaLux AI asszisztense vagyok. Mondja el fogászati gondjait, vagy kérdezzen szolgáltatásainkról — megtalálom a legjobb megoldást!"
      },
      fr: {
        hero_badge: "Nous acceptons de nouveaux patients",
        hero_title1: "Votre Sourire",
        hero_title2: "Parfait Vous",
        hero_title3: "Attend Ici",
        hero_desc: "Soins dentaires de classe mondiale avec technologie de pointe. Des bilans de routine aux transformations complètes — nous parlons votre langue.",
        hero_cta1: "Prendre Rendez-vous",
        hero_cta2: "Nos Services",
        stat1: "Patients Satisfaits",
        stat2: "Taux de Satisfaction",
        stat3: "Ans d'Expérience",
        stat4: "Langues Supportées",
        chat_welcome: "Bonjour! 👋 Je suis l'assistant IA de DentaLux. Décrivez vos problèmes dentaires ou renseignez-vous sur nos services — je vous suggèrerai le bon traitement!"
      }
    };

    const handleMouseMove = (event) => {
      mx = event.clientX;
      my = event.clientY;
      cursor.style.left = `${mx}px`;
      cursor.style.top = `${my}px`;
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      ringFrame = window.requestAnimationFrame(animateRing);
    };

    const handleScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 60);
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const setLang = (lang) => {
      document.querySelectorAll(".lang-btn").forEach((button) => {
        button.classList.toggle("active", button.textContent === lang.toUpperCase());
      });
      const t = translations[lang];
      document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (key && t[key]) {
          element.textContent = t[key];
        }
      });
      chatLang.value = lang;
      welcomeMsg.textContent = t.chat_welcome;
    };

    const getCurrentLang = () => chatLang.value;
    const getSessionId = () => {
      const existing = localStorage.getItem(CHAT_SESSION_KEY);
      if (existing) return existing;
      const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CHAT_SESSION_KEY, created);
      return created;
    };

    const changeChatLang = () => {
      const lang = getCurrentLang();
      welcomeMsg.textContent = translations[lang].chat_welcome;
    };

    const addMessage = (text, sender) => {
      const div = document.createElement("div");
      div.className = `msg ${sender}`;
      const formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
      div.innerHTML = sender === "bot"
        ? `<div class="msg-avatar">🦷</div><div class="msg-bubble">${formatted}</div>`
        : `<div class="msg-bubble">${formatted}</div>`;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showTyping = () => {
      const div = document.createElement("div");
      div.className = "msg bot";
      div.id = "typing";
      div.innerHTML = '<div class="msg-avatar">🦷</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const hideTyping = () => {
      const typing = document.getElementById("typing");
      if (typing) {
        typing.remove();
      }
    };

    const fetchBackendReply = async (message) => {
      const response = await fetch(`${CHAT_API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          language: getCurrentLang(),
          message,
        }),
      });
      if (!response.ok) {
        throw new Error(`Chat API failed (${response.status})`);
      }
      const data = await response.json();
      return data.reply || "I can help with dental services and booking. Please share your symptom or preferred treatment.";
    };

    const sendMessage = async () => {
      const text = chatInput.value.trim();
      if (!text) return;
      addMessage(text, "user");
      chatInput.value = "";
      chatChips.style.display = "none";
      showTyping();
      try {
        const reply = await fetchBackendReply(text);
        hideTyping();
        addMessage(reply, "bot");
      } catch (_error) {
        hideTyping();
        addMessage("⚠️ I cannot reach the clinic assistant server right now. Please try again in a moment.", "bot");
      }
    };

    const sendChip = async (chip) => {
      const text = chip.textContent.replace(/^[^\w]+/, "").trim();
      addMessage(chip.textContent, "user");
      chatChips.style.display = "none";
      showTyping();
      try {
        const reply = await fetchBackendReply(text);
        hideTyping();
        addMessage(reply, "bot");
      } catch (_error) {
        hideTyping();
        addMessage("⚠️ I cannot reach the clinic assistant server right now. Please try again in a moment.", "bot");
      }
    };

    const toggleChat = () => {
      chatOpen = !chatOpen;
      chatWindow.classList.toggle("open", chatOpen);
      chatButton.classList.toggle("open", chatOpen);
      chatButton.innerHTML = chatOpen ? "✕" : '<div class="pulse-ring"></div>🤖';
      if (chatOpen) chatInput.focus();
    };

    const handleBooking = (event) => {
      event.preventDefault();
      const nameField = document.getElementById("bName");
      if (!nameField || !nameField.value) return;
      window.alert(`✅ Thank you, ${nameField.value}! Your appointment request has been received. We'll confirm within 2 hours.`);
      event.target.reset();
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    ringFrame = window.requestAnimationFrame(animateRing);

    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

    const langButtonHandlers = [];
    document.querySelectorAll(".lang-btn").forEach((button) => {
      const handler = () => setLang(button.textContent.toLowerCase());
      langButtonHandlers.push({ button, handler });
      button.addEventListener("click", handler);
    });

    const chipHandlers = [];
    chatChips.querySelectorAll(".chip").forEach((chip) => {
      const handler = () => sendChip(chip);
      chipHandlers.push({ chip, handler });
      chip.addEventListener("click", handler);
    });

    const closeButton = document.querySelector(".chat-close");
    const sendButton = document.getElementById("chat-send");

    chatButton.addEventListener("click", toggleChat);
    closeButton?.addEventListener("click", toggleChat);
    chatLang.addEventListener("change", changeChatLang);
    sendButton?.addEventListener("click", sendMessage);

    const inputKeyHandler = (event) => {
      if (event.key === "Enter") {
        sendMessage();
      }
    };
    chatInput.addEventListener("keydown", inputKeyHandler);

    bookingForm.addEventListener("submit", handleBooking);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(ringFrame);
      revealObserver.disconnect();

      langButtonHandlers.forEach(({ button, handler }) => button.removeEventListener("click", handler));
      chipHandlers.forEach(({ chip, handler }) => chip.removeEventListener("click", handler));

      chatButton.removeEventListener("click", toggleChat);
      closeButton?.removeEventListener("click", toggleChat);
      chatLang.removeEventListener("change", changeChatLang);
      sendButton?.removeEventListener("click", sendMessage);
      chatInput.removeEventListener("keydown", inputKeyHandler);
      bookingForm.removeEventListener("submit", handleBooking);
    };
  }, []);

  return <div id="app-shell" dangerouslySetInnerHTML={{ __html: pageMarkup }} />;
}

export default App;
