/* ============================================
   ROSALIE'S KAKANIN — Admin Panel JavaScript
   Includes: Auth, Posts, AI Agent, Social Media
   ============================================ */

const ADMIN_PASSWORD = 'rosalies2026';
const STORAGE_KEY = 'rosalies_admin';

const App = {
  posts: [],
  settings: {
    socialMedia: {
      facebook: { enabled: false, pageId: '', accessToken: '', url: 'https://www.facebook.com/rosalieskakanin' },
      instagram: { enabled: false, accountId: '', accessToken: '', url: 'https://www.instagram.com/rosalieskakanin' },
      tiktok: { enabled: false, openId: '', accessToken: '', url: 'https://www.tiktok.com/@rosalieskakanin' }
    },
    aiApiKey: ''
  },

  init() {
    this.loadData();
    this.bindLogin();
    this.bindNavigation();
    this.bindCreatePost();
    this.bindAIAgent();
    this.bindSocialSettings();
    this.bindMobileSidebar();
    this.checkSession();
  },

  loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      this.posts = data.posts || [];
      this.settings = { ...this.settings, ...data.settings };
    }
  },

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      posts: this.posts,
      settings: this.settings
    }));
  },

  checkSession() {
    if (sessionStorage.getItem('rosalies_auth') === 'true') {
      this.showDashboard();
    }
  },

  /* ===== AUTH ===== */
  bindLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pw = document.getElementById('loginPassword').value;
      const err = document.getElementById('loginError');
      if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem('rosalies_auth', 'true');
        this.showDashboard();
        err.classList.remove('show');
      } else {
        err.classList.add('show');
        document.getElementById('loginPassword').value = '';
      }
    });
  },

  showDashboard() {
    document.querySelector('.login-screen').style.display = 'none';
    document.querySelector('.admin-layout').classList.add('active');
    this.renderDashboard();
    this.renderPosts();
  },

  logout() {
    sessionStorage.removeItem('rosalies_auth');
    location.reload();
  },

  /* ===== NAVIGATION ===== */
  bindNavigation() {
    document.querySelectorAll('.sidebar-nav a[data-panel]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const panel = link.dataset.panel;
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(panel);
        if (target) target.classList.add('active');

        const titles = {
          'dashboardPanel': 'Dashboard',
          'postsPanel': 'Posts',
          'createPanel': 'Create Post',
          'aiPanel': 'AI Marketing Agent',
          'socialPanel': 'Social Media',
          'settingsPanel': 'Settings'
        };
        const topTitle = document.querySelector('.admin-topbar h1');
        if (topTitle) topTitle.textContent = titles[panel] || 'Dashboard';

        if (window.innerWidth < 768) {
          document.querySelector('.sidebar').classList.remove('open');
        }
      });
    });
  },

  bindMobileSidebar() {
    const toggle = document.querySelector('.mobile-sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
  },

  /* ===== DASHBOARD ===== */
  renderDashboard() {
    const totalPosts = this.posts.length;
    const published = this.posts.filter(p => p.status === 'published').length;
    const socialPosts = this.posts.filter(p => p.socialPosted).length;

    const els = {
      totalPosts: document.getElementById('statTotalPosts'),
      published: document.getElementById('statPublished'),
      socialPosts: document.getElementById('statSocialPosts'),
      aiGenerated: document.getElementById('statAIGenerated')
    };
    if (els.totalPosts) els.totalPosts.textContent = totalPosts;
    if (els.published) els.published.textContent = published;
    if (els.socialPosts) els.socialPosts.textContent = socialPosts;
    if (els.aiGenerated) {
      els.aiGenerated.textContent = this.posts.filter(p => p.aiGenerated).length;
    }
  },

  /* ===== POSTS ===== */
  bindCreatePost() {
    const form = document.getElementById('createPostForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('postTitle').value.trim();
      const content = document.getElementById('postContent').value.trim();
      const category = document.getElementById('postCategory').value;
      const postToSocial = document.getElementById('postToSocial')?.checked || false;

      if (!title || !content) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      const post = {
        id: Date.now().toString(),
        title,
        content,
        category,
        status: 'published',
        socialPosted: false,
        aiGenerated: false,
        createdAt: new Date().toISOString(),
        socialStatus: {}
      };

      this.posts.unshift(post);
      this.saveData();
      this.renderPosts();
      this.renderDashboard();
      form.reset();

      showToast('Post published successfully!', 'success');

      if (postToSocial) {
        this.postToSocialMedia(post);
      }
    });
  },

  renderPosts() {
    const list = document.getElementById('postsList');
    if (!list) return;

    if (this.posts.length === 0) {
      list.innerHTML = '<p style="text-align:center; color: var(--sage); padding: 40px;">No posts yet. Create your first post!</p>';
      return;
    }

    list.innerHTML = this.posts.map(post => {
      const date = new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      const categoryColors = {
        'promotion': 'bibingka',
        'new-product': 'ube',
        'announcement': 'pandan',
        'blog': 'biko',
        'event': 'coconut'
      };

      const socialBadges = post.socialPosted ? `
        <div class="social-badges">
          ${post.socialStatus?.facebook ? '<span class="social-badge fb posted">FB Posted</span>' : ''}
          ${post.socialStatus?.instagram ? '<span class="social-badge ig posted">IG Posted</span>' : ''}
          ${post.socialStatus?.tiktok ? '<span class="social-badge tt posted">TT Posted</span>' : ''}
        </div>
      ` : '';

      return `
        <div class="post-item">
          <div class="post-color ${categoryColors[post.category] || 'coconut'}" style="border-radius:12px;"></div>
          <div class="post-info">
            <h4>${this.escapeHtml(post.title)}</h4>
            <p>${date} &middot; ${post.category} ${post.aiGenerated ? '&middot; AI Generated' : ''}</p>
            ${socialBadges}
          </div>
          <div class="post-actions">
            <button onclick="App.sharePost('${post.id}')">Share</button>
            <button class="delete" onclick="App.deletePost('${post.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  },

  deletePost(id) {
    this.posts = this.posts.filter(p => p.id !== id);
    this.saveData();
    this.renderPosts();
    this.renderDashboard();
    showToast('Post deleted', 'info');
  },

  sharePost(id) {
    const post = this.posts.find(p => p.id === id);
    if (post) {
      this.postToSocialMedia(post);
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /* ===== SOCIAL MEDIA POSTING ===== */
  async postToSocialMedia(post) {
    const sm = this.settings.socialMedia;
    let posted = false;

    if (sm.facebook.enabled && sm.facebook.accessToken) {
      try {
        await this.postToFacebook(post);
        post.socialStatus.facebook = true;
        posted = true;
        showToast('Posted to Facebook!', 'success');
      } catch (err) {
        showToast('Facebook posting failed: ' + err.message, 'error');
      }
    }

    if (sm.instagram.enabled && sm.instagram.accessToken) {
      try {
        await this.postToInstagram(post);
        post.socialStatus.instagram = true;
        posted = true;
        showToast('Posted to Instagram!', 'success');
      } catch (err) {
        showToast('Instagram posting failed: ' + err.message, 'error');
      }
    }

    if (sm.tiktok.enabled && sm.tiktok.accessToken) {
      try {
        await this.postToTikTok(post);
        post.socialStatus.tiktok = true;
        posted = true;
        showToast('Posted to TikTok!', 'success');
      } catch (err) {
        showToast('TikTok posting failed: ' + err.message, 'error');
      }
    }

    if (!sm.facebook.enabled && !sm.instagram.enabled && !sm.tiktok.enabled) {
      showToast('No social media accounts connected. Go to Social Media settings to connect.', 'info');
      return;
    }

    if (posted) {
      post.socialPosted = true;
      this.saveData();
      this.renderPosts();
      this.renderDashboard();
    }
  },

  async postToFacebook(post) {
    const sm = this.settings.socialMedia.facebook;
    const response = await fetch(`https://graph.facebook.com/v18.0/${sm.pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${post.title}\n\n${post.content}\n\n#RosaliesKakanin #Kakanin #FilipinoFood #Marilao #Bulacan`,
        access_token: sm.accessToken
      })
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  async postToInstagram(post) {
    const sm = this.settings.socialMedia.instagram;
    const response = await fetch(`https://graph.facebook.com/v18.0/${sm.accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: `${post.title}\n\n${post.content}\n\n#RosaliesKakanin #Kakanin #FilipinoFood #TraditionalSweets #Marilao #Bulacan #FoodPh`,
        access_token: sm.accessToken
      })
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  async postToTikTok(post) {
    const sm = this.settings.socialMedia.tiktok;
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sm.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: post.title,
          description: post.content,
          privacy_level: 'PUBLIC_TO_EVERYONE'
        }
      })
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  bindSocialSettings() {
    const saveBtn = document.getElementById('saveSocialSettings');
    if (!saveBtn) return;

    this.loadSocialSettingsUI();

    saveBtn.addEventListener('click', () => {
      const sm = this.settings.socialMedia;

      sm.facebook.enabled = document.getElementById('fbEnabled')?.checked || false;
      sm.facebook.pageId = document.getElementById('fbPageId')?.value || '';
      sm.facebook.accessToken = document.getElementById('fbToken')?.value || '';
      sm.facebook.url = document.getElementById('fbUrl')?.value || sm.facebook.url;

      sm.instagram.enabled = document.getElementById('igEnabled')?.checked || false;
      sm.instagram.accountId = document.getElementById('igAccountId')?.value || '';
      sm.instagram.accessToken = document.getElementById('igToken')?.value || '';
      sm.instagram.url = document.getElementById('igUrl')?.value || sm.instagram.url;

      sm.tiktok.enabled = document.getElementById('ttEnabled')?.checked || false;
      sm.tiktok.openId = document.getElementById('ttOpenId')?.value || '';
      sm.tiktok.accessToken = document.getElementById('ttToken')?.value || '';
      sm.tiktok.url = document.getElementById('ttUrl')?.value || sm.tiktok.url;

      this.saveData();
      showToast('Social media settings saved!', 'success');
    });
  },

  loadSocialSettingsUI() {
    const sm = this.settings.socialMedia;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val || false; };

    setCheck('fbEnabled', sm.facebook.enabled);
    setVal('fbPageId', sm.facebook.pageId);
    setVal('fbToken', sm.facebook.accessToken);
    setVal('fbUrl', sm.facebook.url);

    setCheck('igEnabled', sm.instagram.enabled);
    setVal('igAccountId', sm.instagram.accountId);
    setVal('igToken', sm.instagram.accessToken);
    setVal('igUrl', sm.instagram.url);

    setCheck('ttEnabled', sm.tiktok.enabled);
    setVal('ttOpenId', sm.tiktok.openId);
    setVal('ttToken', sm.tiktok.accessToken);
    setVal('ttUrl', sm.tiktok.url);
  },

  /* ===== AI MARKETING AGENT ===== */
  bindAIAgent() {
    const sendBtn = document.getElementById('aiSend');
    const input = document.getElementById('aiInput');
    if (!sendBtn || !input) return;

    const sendMessage = () => {
      const msg = input.value.trim();
      if (!msg) return;
      this.addAIMessage('user', msg);
      input.value = '';
      this.generateAIResponse(msg);
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    document.querySelectorAll('.ai-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        this.addAIMessage('user', prompt);
        this.generateAIResponse(prompt);
      });
    });
  },

  addAIMessage(type, text) {
    const chat = document.getElementById('aiChat');
    if (!chat) return;

    const div = document.createElement('div');
    div.className = `ai-message ${type}`;
    div.innerHTML = `
      <div class="avatar">${type === 'agent' ? '🤖' : '👤'}</div>
      <div class="bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  },

  async generateAIResponse(prompt) {
    const apiKey = this.settings.aiApiKey || document.getElementById('claudeApiKey')?.value;

    if (apiKey) {
      this.addAIMessage('agent', 'Thinking... ✨');
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: `You are "Rosalie's Marketing Agent" — an expert food marketing copywriter and SEO specialist for Rosalie's Kakanin, a Filipino kakanin (rice cake) business in Marilao, Bulacan, Philippines.

Your expertise:
- Writing mouth-watering, sensory-rich food descriptions that make customers CRAVE and BUY
- SEO optimization for local food businesses
- Social media content for Facebook, Instagram, and TikTok
- Filipino food culture and kakanin traditions
- Using urgency, scarcity, and emotional triggers to drive purchases
- Creating content that feels warm, authentic, and irresistible

Products: Bibingka Special, Ube Sapin-Sapin, Biko, Suman sa Lihiya, Pandan Kutsinta, Leche Flan Toppings
Location: 9009 Super NLEX, Patubig, Marilao, Bulacan
Phone: 0917-558-4276 / 0939-921-7118
Tagline: "Traditional Treats, Made with Love"

Always write in a way that:
1. Makes the reader smell, taste, and feel the food
2. Creates urgency ("limited batches", "best enjoyed fresh today")
3. Triggers nostalgia ("lola's kitchen", "fiesta memories")
4. Includes relevant hashtags for social media posts
5. Uses SEO keywords naturally
6. Keeps the warm, loving brand voice of Rosalie's

Keep responses concise and ready to use.`,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const lastMsg = document.querySelector('#aiChat .ai-message:last-child');
        if (lastMsg) lastMsg.remove();

        if (response.ok) {
          const data = await response.json();
          const reply = data.content[0].text;
          this.addAIMessage('agent', reply);
        } else {
          throw new Error('API request failed');
        }
      } catch (err) {
        const lastMsg = document.querySelector('#aiChat .ai-message:last-child');
        if (lastMsg && lastMsg.querySelector('.bubble')?.textContent.includes('Thinking')) {
          lastMsg.remove();
        }
        this.generateLocalResponse(prompt);
      }
    } else {
      this.generateLocalResponse(prompt);
    }
  },

  generateLocalResponse(prompt) {
    const lower = prompt.toLowerCase();
    let response = '';

    if (lower.includes('bibingka') || lower.includes('product description')) {
      response = `🔥 Here's a mouth-watering product description:\n\n**Bibingka Special — Fresh from Rosalie's Pugon**\n\nImagine this: golden-brown rice cake, straight from the clay oven, its edges perfectly caramelized. Each slice is crowned with creamy salted egg, melted cheese, and a generous brush of fresh coconut milk that glistens in the light.\n\nThe first bite? Soft, warm, and slightly sweet — like a hug from your Lola's kitchen. The salted egg adds that perfect savory contrast, while the cheese pulls apart in beautiful strings.\n\n✨ Made fresh daily in small batches\n📍 Available for pickup or delivery in Marilao\n📞 Order: 0917-558-4276\n\n#BibingkaSpecial #RosaliesKakanin #FreshFromThePugon #FilipinoFood #Kakanin #MarilaoBulacan #FoodPh`;
    } else if (lower.includes('social media') || lower.includes('caption') || lower.includes('post')) {
      response = `📱 Here are 3 social media captions ready to post:\n\n**Caption 1 (Urgency):**\n"Bagong luto lang! 🔥 Our Ube Sapin-Sapin is fresh out of the kitchen — only 15 trays available today. Once they're gone, they're GONE. Order now before your neighbor does! 😋\n\n📞 0917-558-4276\n📍 Patubig, Marilao\n\n#UbeSapinSapin #LimitedBatch #RosaliesKakanin #OrderNow"\n\n**Caption 2 (Nostalgia):**\n"Remember the taste of kakanin from your Lola's kitchen? That's exactly what we're bringing to your table. Handmade, made with love, made the traditional way. 💛\n\nTry our bestselling Biko with latik — one bite and you're home again.\n\n#TasteOfHome #FilipinoTradition #Biko #RosaliesKakanin"\n\n**Caption 3 (Fiesta):**\n"Planning a birthday? Baptism? Office celebration? 🎉 Let Rosalie's Kakanin make your fiesta complete!\n\nBulk orders welcome — we'll make it fresh just for your special day.\n\n📞 Call/text: 0939-921-7118\n\n#FiestaFood #BulkOrders #Kakanin #CelebrationFood"`;
    } else if (lower.includes('seo') || lower.includes('keyword') || lower.includes('search')) {
      response = `🔍 **SEO Strategy for Rosalie's Kakanin:**\n\n**Target Keywords (High Intent):**\n• "kakanin in Marilao Bulacan"\n• "bibingka delivery Marilao"\n• "best kakanin near me"\n• "sapin sapin order Bulacan"\n• "biko for sale Marilao"\n• "Filipino rice cake Bulacan"\n\n**Meta Title:**\nRosalie's Kakanin | Fresh Bibingka, Sapin-Sapin & Biko in Marilao, Bulacan\n\n**Meta Description:**\nOrder fresh, handmade kakanin from Rosalie's in Marilao, Bulacan. Bibingka Special, Ube Sapin-Sapin, Biko with latik & more. Made daily with love. Call 0917-558-4276.\n\n**Blog Post Ideas:**\n1. "5 Reasons Why Rosalie's Bibingka Is the Best in Marilao"\n2. "The Story Behind Our Secret Biko Recipe"\n3. "Kakanin Guide: Which One Should You Order for Your Fiesta?"\n4. "How We Make Our Ube Sapin-Sapin (Hint: Real Ube Only!)"`;
    } else if (lower.includes('tiktok') || lower.includes('video') || lower.includes('reel')) {
      response = `🎬 **TikTok/Reels Content Ideas:**\n\n**Video 1: "Watch How We Make Bibingka" (Process Shot)**\nScript: No talking — just ASMR cooking sounds\n• Show coconut milk pouring\n• Rice batter spreading on banana leaf\n• Salted egg being placed on top\n• Golden bibingka coming out of the oven\n• Steam rising, close-up cut\nCaption: "This is how love looks in a pugon 🔥 #BibingkaASMR #RosaliesKakanin #FoodTikTok"\n\n**Video 2: "Rate Our Kakanin" (Trending Format)**\nShow each kakanin with customer reactions\nCaption: "Which one's YOUR favorite? Comment below! 👇 #KakaninCheck #FilipinoFood"\n\n**Video 3: "POV: You ordered ALL 6" (Satisfying)**\nShow trays being opened one by one\nCaption: "The ultimate kakanin haul 🤤 Order yours at 0917-558-4276 #FoodHaul #Kakanin"`;
    } else if (lower.includes('promo') || lower.includes('sale') || lower.includes('discount')) {
      response = `💰 **Promo Ideas & Copy:**\n\n**Bundle Deal:**\n"🎉 KAKANIN BUNDLE ALERT!\n\nGet ANY 3 trays for just ₱380 (save ₱50)!\n\nMix and match your favorites:\n✅ Bibingka Special\n✅ Ube Sapin-Sapin\n✅ Biko with Latik\n✅ Pandan Kutsinta\n✅ Suman sa Lihiya\n\n⏰ This weekend ONLY — Fri to Sun\n📞 Reserve yours: 0917-558-4276\n📍 Pickup at Patubig, Marilao\n\n#BundleDeal #KakaninPromo #WeekendTreats #RosaliesKakanin"\n\n**First-Time Buyer:**\n"First time ordering? Get a FREE slice of our Leche Flan topping with any tray purchase! 🍮\n\nJust mention 'FIRST ORDER' when you message us.\n\n#FreeTreat #TryRosalies #NewCustomerPromo"`;
    } else {
      response = `Hey there! I'm Rosalie's Marketing Agent 🍃\n\nI can help you with:\n\n• **Product Descriptions** — mouth-watering copy for your kakanin\n• **Social Media Captions** — ready-to-post content for FB, IG & TikTok\n• **SEO Keywords** — boost your search visibility\n• **Promo Ideas** — deals that drive sales\n• **TikTok/Reels Scripts** — viral video content ideas\n• **Blog Posts** — long-form content that ranks\n\nJust tell me what you need! For example:\n"Write a caption for our Bibingka Special"\n"Give me TikTok video ideas"\n"Create a weekend promo post"`;
    }

    this.addAIMessage('agent', response);
  }
};

/* ===== Toast Notifications ===== */
function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}

document.addEventListener('DOMContentLoaded', () => App.init());
