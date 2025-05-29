document.addEventListener('DOMContentLoaded', () => {
  console.log("=== main.js Carregado ===");
  let walletAddress = null;
  let inMemoryProducts = []; // Fallback para produtos em memória
  try {
    walletAddress = localStorage.getItem('walletAddress') || null;
  } catch (error) {
    console.error('Erro ao acessar walletAddress no localStorage:', error);
  }

  // Inicializar funções
  updateWalletUI();
  if (window.location.pathname.includes('evaluate.html')) {
    loadProducts();
    checkReviewedProducts();
    attachReviewFormListeners();
    setupModalListeners();
  }
  if (window.location.pathname.includes('profile.html')) updateProfilePage();
  if (window.location.pathname.includes('rewards.html')) updateRankingList();
  updateStakedTokens();
  if (window.location.pathname.includes('submit-product.html')) setupSubmitProductForm();

  // Atualizar UI da carteira
  function updateWalletUI() {
    console.log("Atualizando UI da carteira...");
    const walletBtn = document.getElementById('connectWallet');
    if (walletBtn) {
      walletBtn.textContent = walletAddress ? 'Desconectar' : 'Conectar Carteira';
      walletBtn.classList.toggle('connected', !!walletAddress);
      walletBtn.classList.toggle('btn-secondary', !!walletAddress);
      walletBtn.classList.toggle('btn-primary', !walletAddress);
      checkReviewedProducts();
    }
  }

  // Obter dados do usuário
  function getUserData(walletAddress) {
    let walletsData = {};
    try {
      walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    } catch (error) {
      console.error('Erro ao acessar walletsData no localStorage:', error);
    }
    return walletsData[walletAddress] || { balance: 0, reviews: [], stakes: [] };
  }

  // Salvar dados do usuário
  function saveUserData(walletAddress, data) {
    try {
      let walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
      walletsData[walletAddress] = data;
      localStorage.setItem('walletsData', JSON.stringify(walletsData));
    } catch (error) {
      console.error('Erro ao salvar walletsData no localStorage:', error);
    }
  }

  // Limpar endereço da carteira
  function clearWalletAddress() {
    try {
      localStorage.removeItem('walletAddress');
    } catch (error) {
      console.error('Erro ao remover walletAddress do localStorage:', error);
    }
  }

  // Contar avaliações de um produto
  function countProductReviews(productName) {
    let walletsData = {};
    try {
      walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    } catch (error) {
      console.error('Erro ao acessar walletsData no localStorage:', error);
    }
    let count = 0;
    Object.values(walletsData).forEach(userData => {
      if (userData.reviews) {
        count += userData.reviews.filter(review => review.product === productName).length;
      }
    });
    return count;
  }

  // Conexão/desconexão da carteira
  const connectWalletBtn = document.getElementById('connectWallet');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async () => {
      console.log("Botão de conexão clicado...");
      if (walletAddress) {
        walletAddress = null;
        clearWalletAddress();
        alert('Carteira desconectada!');
      } else {
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
          try {
            const resp = await window.solana.connect();
            walletAddress = resp.publicKey.toString();
            try {
              localStorage.setItem('walletAddress', walletAddress);
            } catch (error) {
              console.error('Erro ao salvar walletAddress no localStorage:', error);
              alert('Erro ao salvar endereço da carteira.');
              return;
            }
            const userData = getUserData(walletAddress);
            if (!userData.balance && !userData.reviews && !userData.stakes) {
              userData.balance = 0;
              userData.reviews = [];
              userData.stakes = [];
              saveUserData(walletAddress, userData);
            }
            alert(`Conectado à Phantom Wallet: ${walletAddress}`);
          } catch (error) {
            console.error('Erro ao conectar Phantom Wallet:', error);
            alert('Erro ao conectar à Phantom Wallet: ' + error.message);
          }
        } else {
          alert('Por favor, instale a Phantom Wallet!');
          window.open('https://phantom.app/', '_blank');
        }
      }
      updateWalletUI();
      updateStakedTokens();
      updateProfilePage();
      updateRankingList();
    });
  }

  // Verificar produtos avaliados
  function checkReviewedProducts() {
    if (!walletAddress) return;
    const userData = getUserData(walletAddress);
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent;
      const selectBtn = card.querySelector('.btn-select');
      if (productName && selectBtn) {
        const hasReviewed = userData.reviews.some(review => review.product === productName);
        selectBtn.classList.toggle('disabled', hasReviewed);
        selectBtn.textContent = hasReviewed ? '✓ Já Avaliado' : 'Avaliar Selecionado';
        if (!hasReviewed && !selectBtn.dataset.listener) {
          selectBtn.addEventListener('click', toggleReviewForm);
          selectBtn.dataset.listener = 'true';
        }
      }
    });
  }

  // Alternar formulário de avaliação
  function toggleReviewForm(e) {
    e.preventDefault();
    console.log("Alternando formulário de avaliação...");
    const card = e.target.closest('.product-card');
    const selectBtn = card.querySelector('.btn-select');
    if (card && selectBtn) {
      card.classList.toggle('review-active');
      selectBtn.textContent = card.classList.contains('review-active') ? 'Voltar' : 'Avaliar Selecionado';
    }
  }

  // Produtos de teste estáticos (fallback)
  const defaultProducts = [
    {
      name: "Smartphone X",
      description: "Um smartphone moderno com câmera de 48MP.",
      image: "https://picsum.photos/300/300?random=1",
      category: "Eletrônicos",
      wallet: "test-wallet",
      timestamp: new Date().toLocaleString('pt-BR')
    },
    {
      name: "Tênis de Corrida",
      description: "Tênis leve e confortável para corridas diárias.",
      image: "https://picsum.photos/300/300?random=2",
      category: "Esportes",
      wallet: "test-wallet",
      timestamp: new Date().toLocaleString('pt-BR')
    },
    {
      name: "Livro: Aventuras Cósmicas",
      description: "Uma ficção científica envolvente sobre exploração espacial.",
      image: "https://picsum.photos/300/300?random=3",
      category: "Livros",
      wallet: "test-wallet",
      timestamp: new Date().toLocaleString('pt-BR')
    },
    {
      name: "Kit de Jardinagem",
      description: "Ferramentas essenciais para cuidar do seu jardim.",
      image: "https://picsum.photos/300/300?random=4",
      category: "Jardinagem",
      wallet: "test-wallet",
      timestamp: new Date().toLocaleString('pt-BR')
    },
    {
      name: "Boneco de Ação",
      description: "Boneco articulado inspirado em super-heróis.",
      image: "https://picsum.photos/300/300?random=5",
      category: "Brinquedos",
      wallet: "test-wallet",
      timestamp: new Date().toLocaleString('pt-BR')
    }
  ];

  // Carregar produtos
  function loadProducts() {
    console.log("=== Carregando Produtos ===");
    const productList = document.querySelector('.product-list');
    if (!productList) {
      console.error("Elemento .product-list não encontrado no DOM.");
      return;
    }

    productList.innerHTML = '';
    let userProducts = [];
    let localStorageAvailable = true;

    try {
      const storedProducts = localStorage.getItem('products');
      userProducts = storedProducts ? JSON.parse(storedProducts) : [];
      console.log("Produtos carregados do localStorage:", userProducts.length);
    } catch (error) {
      console.error('Erro ao acessar ou parsear products no localStorage:', error);
      localStorageAvailable = false;
    }

    if (!Array.isArray(userProducts) || userProducts.length === 0) {
      console.warn("Nenhum produto encontrado. Usando produtos de teste e inMemoryProducts.");
      userProducts = [...defaultProducts, ...inMemoryProducts];
      if (localStorageAvailable) {
        try {
          localStorage.setItem('products', JSON.stringify(userProducts));
          console.log("Produtos de teste salvos no localStorage:", userProducts);
        } catch (error) {
          console.error('Erro ao salvar produtos de teste no localStorage:', error);
          localStorageAvailable = false;
        }
      }
    }

    if (userProducts.length === 0) {
      console.warn("Ainda sem produtos após inicialização.");
      productList.innerHTML = '<p class="no-products">Nenhum produto disponível no momento.</p>';
      return;
    }

    const categories = {};
    userProducts.forEach(product => {
      if (!categories[product.category]) categories[product.category] = [];
      categories[product.category].push(product);
    });

    Object.keys(categories).forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.className = 'category-section';
      categorySection.innerHTML = `<h3 class="category-title">${category}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      categorySection.appendChild(grid);
      productList.appendChild(categorySection);

      categories[category].forEach((product, index) => {
        const reviewCount = countProductReviews(product.name);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <img src="${product.image}" alt="${product.name}">
          <div class="content">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="review-count"><i class="fas fa-star"></i> ${reviewCount} Avaliação${reviewCount !== 1 ? 'es' : ''}</span>
            <span class="read-more">Ler mais</span>
            <div class="button-group">
              <button class="btn btn-info btn-details" data-product-name="${encodeURIComponent(product.name)}">Ver Detalhes</button>
              <button class="btn btn-select">Avaliar Selecionado</button>
            </div>
          </div>
          <div class="review-form">
            <h4>Avaliar ${product.name}</h4>
            <form>
              <div class="form-group">
                <label for="reviewText${category}_${index}">Sua Avaliação (em inglês)</label>
                <textarea id="reviewText${category}_${index}" rows="3" placeholder="Share your feedback in English..." required></textarea>
              </div>
              <div class="form-group">
                <label>Classificação</label>
                <div class="star-rating">
                  <span class="star" data-value="1">★</span>
                  <span class="star" data-value="2">★</span>
                  <span class="star" data-value="3">★</span>
                  <span class="star" data-value="4">★</span>
                  <span class="star" data-value="5">★</span>
                </div>
              </div>
              <div class="form-group">
                <label>Sentimento</label>
                <div class="thumb-rating">
                  <i class="fas fa-thumbs-up thumb up"></i>
                  <i class="fas fa-thumbs-down thumb down"></i>
                </div>
              </div>
              <button type="submit" class="btn-submit">Enviar Avaliação</button>
            </form>
          </div>
        `;
        grid.appendChild(card);

        const readMore = card.querySelector('.read-more');
        readMore.addEventListener('click', () => {
          const description = card.querySelector('p');
          const isExpanded = description.classList.toggle('expanded');
          readMore.textContent = isExpanded ? 'Ler menos' : 'Ler mais';
        });
      });
    });

    console.log("Produtos renderizados:", Object.keys(categories).length, "categorias com", userProducts.length, "produtos no total.");
    checkReviewedProducts();
    attachReviewFormListeners();
  }

  // Configurar ouvintes do modal
  function setupModalListeners() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.modal-close');
    if (modal && closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
      window.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }

    const detailsButtons = document.querySelectorAll('.btn-details');
    detailsButtons.forEach(button => {
      button.addEventListener('click', () => {
        const productName = decodeURIComponent(button.dataset.productName);
        showProductModal(productName);
      });
    });
  }

  // Exibir modal com detalhes do produto
  function showProductModal(productName) {
    console.log("Exibindo modal para produto:", productName);
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modalProductDetails');
    if (!modal || !modalContent) {
      console.error("Elementos do modal não encontrados.");
      return;
    }

    let products = [];
    try {
      products = JSON.parse(localStorage.getItem('products') || '[]');
    } catch (error) {
      console.error('Erro ao acessar products no localStorage:', error);
      products = [...defaultProducts, ...inMemoryProducts];
    }

    const product = products.find(p => p.name === productName);
    if (!product) {
      console.warn("Produto não encontrado:", productName);
      modalContent.innerHTML = '<p>Produto não encontrado.</p>';
      modal.style.display = 'block';
      return;
    }

    let walletsData = {};
    try {
      walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    } catch (error) {
      console.error('Erro ao acessar walletsData no localStorage:', error);
    }
    const reviews = [];
    Object.keys(walletsData).forEach(wallet => {
      const userData = walletsData[wallet];
      if (userData.reviews) {
        userData.reviews.forEach(review => {
          if (review.product === product.name) {
            reviews.push({ ...review, wallet });
          }
        });
      }
    });

    const reviewCount = countProductReviews(product.name);
    modalContent.innerHTML = `
      <h2>${product.name}</h2>
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <p><strong>Descrição:</strong> ${product.description || 'Sem descrição.'}</p>
      <p><strong>Categoria:</strong> ${product.category || 'Sem categoria'}</p>
      <p><strong>Avaliações:</strong> ${reviewCount}</p>
      <div class="review-form" id="modalReviewForm">
        <h4>Avaliar ${product.name}</h4>
        <form id="modalProductReviewForm">
          <div class="form-group">
            <label for="modalReviewText">Sua Avaliação (em inglês)</label>
            <textarea id="modalReviewText" rows="4" placeholder="Share your feedback in English..." required></textarea>
          </div>
          <div class="form-group">
            <label>Classificação</label>
            <div class="star-rating">
              <span class="star" data-value="1">★</span>
              <span class="star" data-value="2">★</span>
              <span class="star" data-value="3">★</span>
              <span class="star" data-value="4">★</span>
              <span class="star" data-value="5">★</span>
            </div>
          </div>
          <div class="form-group">
            <label>Sentimento</label>
            <div class="thumb-rating">
              <i class="fas fa-thumbs-up thumb up"></i>
              <i class="fas fa-thumbs-down thumb down"></i>
            </div>
          </div>
          <button type="submit" class="btn-submit">Enviar Avaliação</button>
        </form>
      </div>
      <h3>Avaliações</h3>
      <div class="review-table">
        <table>
          <thead>
            <tr>
              <th>Carteira</th>
              <th>Avaliação</th>
              <th>Classificação</th>
              <th>Sentimento</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody id="modalReviewList">
            ${reviews.length === 0 ? '<tr><td colspan="5">Nenhuma avaliação disponível.</td></tr>' : reviews.map(review => {
              const maskedWallet = `${review.wallet.slice(0, 6)}...${review.wallet.slice(-4)}`;
              const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
              return `
                <tr>
                  <td>${maskedWallet}</td>
                  <td>${review.text}</td>
                  <td><span class="stars">${stars}</span></td>
                  <td><i class="fas fa-thumbs-${review.thumb === 'Positive' ? 'up thumb-up' : 'down thumb-down'}"></i></td>
                  <td>${review.timestamp}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    modal.style.display = 'block';

    // Configurar formulário de avaliação no modal
    const modalReviewForm = document.getElementById('modalProductReviewForm');
    if (modalReviewForm) {
      const stars = modalReviewForm.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const value = star.getAttribute('data-value');
          stars.forEach(s => s.classList.toggle('selected', s.getAttribute('data-value') <= value));
        });
      });

      const thumbs = modalReviewForm.querySelectorAll('.thumb');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('selected'));
          thumb.classList.add('selected');
        });
      });

      modalReviewForm.addEventListener('submit', e => {
        e.preventDefault();
        console.log("Formulário de avaliação enviado (modal)");
        if (!walletAddress) {
          alert('Por favor, conecte sua carteira primeiro!');
          return;
        }

        const reviewText = modalReviewForm.querySelector('textarea').value.trim();
        const selectedStars = modalReviewForm.querySelectorAll('.star.selected').length;
        const selectedThumb = modalReviewForm.querySelector('.thumb.selected');
        const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positive' : 'Negative') : null;

        if (!reviewText || reviewText.length < 10) {
          alert('A avaliação deve ter pelo menos 10 caracteres.');
          return;
        }
        if (selectedStars === 0) {
          alert('Por favor, selecione uma classificação por estrelas.');
          return;
        }
        if (!thumbType) {
          alert('Por favor, selecione um sentimento (polegar para cima ou para baixo).');
          return;
        }

        const userData = getUserData(walletAddress);
        if (userData.reviews.some(review => review.product === productName)) {
          alert('Você já avaliou este produto!');
          return;
        }

        const tokensEarned = 10;
        const stakeAmount = tokensEarned * 0.1;
        const availableTokens = tokensEarned - stakeAmount;

        userData.reviews.push({
          product: productName,
          text: reviewText,
          stars: selectedStars,
          thumb: thumbType,
          tokens: tokensEarned,
          timestamp: new Date().toLocaleString('pt-BR')
        });

        userData.balance += availableTokens;
        userData.stakes.push({
          amount: stakeAmount,
          date: new Date().toISOString()
        });

        saveUserData(walletAddress, userData);

        alert(`Avaliação enviada para ${productName}!\nClassificação: ${selectedStars} estrelas\nSentimento: ${thumbType}\nTokens Ganhos: ${tokensEarned.toFixed(2)} DET`);

        modalReviewForm.reset();
        stars.forEach(s => s.classList.remove('selected'));
        thumbs.forEach(t => t.classList.remove('selected'));
        modal.style.display = 'none';
        loadProducts();
        updateStakedTokens();
        updateProfilePage();
        updateRankingList();
      });
    }
  }

  // Anexar ouvintes ao formulário de avaliação
  function attachReviewFormListeners() {
    console.log("Anexando ouvintes ao formulário de avaliação...");
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const reviewForm = card.querySelector('.review-form form');
      if (!reviewForm) return;

      const stars = reviewForm.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const rating = star.getAttribute('data-value');
          stars.forEach(s => s.classList.toggle('selected', s.getAttribute('data-value') <= rating));
        });
      });

      const thumbs = reviewForm.querySelectorAll('.thumb');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('selected'));
          thumb.classList.add('selected');
        });
      });

      reviewForm.addEventListener('submit', e => {
        e.preventDefault();
        console.log("Formulário de avaliação enviado (evaluate.html)");
        if (!walletAddress) {
          alert('Por favor, conecte sua carteira primeiro!');
          return;
        }

        const productName = card.querySelector('h3').textContent;
        const reviewText = reviewForm.querySelector('textarea').value.trim();
        const selectedStars = reviewForm.querySelectorAll('.star.selected').length;
        const selectedThumb = reviewForm.querySelector('.thumb.selected');
        const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positive' : 'Negative') : null;

        if (!reviewText || reviewText.length < 10) {
          alert('A avaliação deve ter pelo menos 10 caracteres.');
          return;
        }
        if (selectedStars === 0) {
          alert('Por favor, selecione uma classificação por estrelas.');
          return;
        }
        if (!thumbType) {
          alert('Por favor, selecione um sentimento (polegar para cima ou para baixo).');
          return;
        }

        const userData = getUserData(walletAddress);
        if (userData.reviews.some(review => review.product === productName)) {
          alert('Você já avaliou este produto!');
          return;
        }

        const tokensEarned = 10;
        const stakeAmount = tokensEarned * 0.1;
        const availableTokens = tokensEarned - stakeAmount;

        userData.reviews.push({
          product: productName,
          text: reviewText,
          stars: selectedStars,
          thumb: thumbType,
          tokens: tokensEarned,
          timestamp: new Date().toLocaleString('pt-BR')
        });

        userData.balance += availableTokens;
        userData.stakes.push({
          amount: stakeAmount,
          date: new Date().toISOString()
        });

        saveUserData(walletAddress, userData);

        alert(`Avaliação enviada para ${productName}!\nClassificação: ${selectedStars} estrelas\nSentimento: ${thumbType}\nTokens Ganhos: ${tokensEarned.toFixed(2)} DET`);

        reviewForm.reset();
        stars.forEach(s => s.classList.remove('selected'));
        thumbs.forEach(t => t.classList.remove('selected'));
        const selectBtn = card.querySelector('.btn-select');
        selectBtn.classList.add('disabled');
        selectBtn.textContent = '✓ Já Avaliado';
        selectBtn.removeEventListener('click', toggleReviewForm);
        card.classList.remove('review-active');
        loadProducts();
        updateStakedTokens();
        updateProfilePage();
        updateRankingList();
      });
    });
  }

  // Atualizar tokens em stake
  function updateStakedTokens() {
    const stakedTokensElement = document.getElementById('stakedTokens');
    const stakeReleaseDateElement = document.getElementById('stakeReleaseDate');
    const stakeRewardsElement = document.getElementById('stakeRewards');
    if (stakedTokensElement && stakeReleaseDateElement && stakeRewardsElement) {
      if (!walletAddress) {
        stakedTokensElement.textContent = '0.00 DET';
        stakeReleaseDateElement.textContent = 'N/A';
        stakeRewardsElement.textContent = '0.00 DET';
        return;
      }

      const userData = getUserData(walletAddress);
      const now = new Date();
      let totalStaked = 0;
      let latestReleaseDate = null;
      let totalRewards = 0;

      const updatedStakes = [];
      userData.stakes.forEach(stake => {
        const stakeDate = new Date(stake.date);
        const releaseDate = new Date(stakeDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        if (isNaN(releaseDate.getTime())) {
          console.error('Data de stake inválida:', stake.date);
          return;
        }
        if (now >= releaseDate) {
          userData.balance += stake.amount + (stake.amount * 0.5);
          console.log(`Stake liberado: ${stake.amount.toFixed(2)} DET + ${(stake.amount * 0.5).toFixed(2)} DET`);
        } else {
          updatedStakes.push(stake);
          totalStaked += stake.amount;
          totalRewards += stake.amount * 0.5;
          if (!latestReleaseDate || releaseDate > latestReleaseDate) {
            latestReleaseDate = releaseDate;
          }
        }
      });

      userData.stakes = updatedStakes;
      saveUserData(walletAddress, userData);

      stakedTokensElement.textContent = `${totalStaked.toFixed(2)} DET`;
      stakeReleaseDateElement.textContent = latestReleaseDate ? latestReleaseDate.toLocaleDateString('pt-BR') : 'N/A';
      stakeRewardsElement.textContent = `${totalRewards.toFixed(2)} DET`;
    }

    // Atualizar tokens totais em stake para rewards.html
    const totalStakedTokensElement = document.getElementById('totalStakedTokens');
    if (totalStakedTokensElement) {
      let walletsData = {};
      try {
        walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
      } catch (error) {
        console.error('Erro ao acessar walletsData no localStorage:', error);
      }
      let totalStakedTokens = 0;
      const now = new Date();
      Object.values(walletsData).forEach(userData => {
        if (userData.stakes) {
          userData.stakes.forEach(stake => {
            const stakeDate = new Date(stake.date);
            const releaseDate = new Date(stakeDate.getTime() + 90 * 24 * 60 * 60 * 1000);
            if (now < releaseDate) {
              totalStakedTokens += stake.amount;
            }
          });
        }
      });
      totalStakedTokensElement.textContent = `${totalStakedTokens.toFixed(2)} DET`;
    }
  }

  // Atualizar página de perfil
  function updateProfilePage() {
    const tokenBalanceElement = document.getElementById('tokenBalance');
    const reviewHistoryElement = document.getElementById('reviewHistory');
    const walletAddressElement = document.getElementById('walletAddress');
    if (tokenBalanceElement && reviewHistoryElement && walletAddressElement) {
      walletAddressElement.textContent = walletAddress || 'Não conectado';
      if (!walletAddress) {
        tokenBalanceElement.textContent = '0.00 DET';
        reviewHistoryElement.innerHTML = '<tr><td colspan="6">Nenhuma avaliação ainda.</td></tr>';
        return;
      }

      const userData = getUserData(walletAddress);
      tokenBalanceElement.textContent = `${userData.balance.toFixed(2)} DET`;

      reviewHistoryElement.innerHTML = '';
      if (userData.reviews.length > 0) {
        userData.reviews.forEach(review => {
          const row = document.createElement('tr');
          const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
          row.innerHTML = `
            <td>${review.product}</td>
            <td>${review.text}</td>
            <td><span class="stars">${stars}</span></td>
            <td><i class="fas fa-thumbs-${review.thumb === 'Positive' ? 'up thumb-up' : 'down thumb-down'}"></i></td>
            <td>${review.tokens.toFixed(2)}</td>
            <td>${review.timestamp}</td>
          `;
          reviewHistoryElement.appendChild(row);
        });
      } else {
        reviewHistoryElement.innerHTML = '<tr><td colspan="6">Nenhuma avaliação ainda.</td></tr>';
      }
    }
  }

  // Atualizar lista de ranking
  function updateRankingList() {
    console.log("Atualizando ranking...");
    const rankingListElement = document.getElementById('rankingList');
    const totalReviewsElement = document.getElementById('totalReviews');
    const totalTokensElement = document.getElementById('totalTokens');
    const totalStakedTokensElement = document.getElementById('totalStakedTokens');
    const userRankingElement = document.getElementById('userRanking');
    const rankingSortElement = document.getElementById('rankingSort');

    if (!rankingListElement) return;

    let walletsData = {};
    try {
      walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    } catch (error) {
      console.error('Erro ao acessar walletsData no localStorage:', error);
    }
    let ranking = Object.keys(walletsData).map(wallet => {
      const userData = walletsData[wallet];
      const totalTokens = userData.reviews.reduce((sum, review) => sum + (review.tokens || 0), 0);
      return { wallet, reviews: userData.reviews.length, totalTokens };
    });

    let totalReviews = 0;
    let totalTokens = 0;
    let totalStakedTokens = 0;
    ranking.forEach(user => {
      totalReviews += user.reviews;
      totalTokens += user.totalTokens;
    });
    Object.values(walletsData).forEach(userData => {
      if (userData.stakes) {
        const now = new Date();
        userData.stakes.forEach(stake => {
          const stakeDate = new Date(stake.date);
          const releaseDate = new Date(stakeDate.getTime() + 90 * 24 * 60 * 60 * 1000);
          if (now < releaseDate) {
            totalStakedTokens += stake.amount;
          }
        });
      }
    });

    if (totalReviewsElement) totalReviewsElement.textContent = totalReviews;
    if (totalTokensElement) totalTokensElement.textContent = `${totalTokens.toFixed(2)} DET`;
    if (totalStakedTokensElement) totalStakedTokensElement.textContent = `${totalStakedTokens.toFixed(2)} DET`;

    const sortBy = rankingSortElement ? rankingSortElement.value : 'reviews';
    ranking.sort((a, b) => {
      if (sortBy === 'tokens') {
        return b.totalTokens - a.totalTokens || b.reviews - a.reviews;
      }
      return b.reviews - a.reviews || b.totalTokens - a.totalTokens;
    });

    if (userRankingElement) {
      if (!walletAddress) {
        userRankingElement.textContent = 'Conecte sua carteira para ver seu ranking!';
        userRankingElement.classList.remove('current-user');
      } else {
        const userRank = ranking.findIndex(user => user.wallet === walletAddress) + 1;
        if (userRank > 0) {
          userRankingElement.textContent = `Você está em ${userRank}º lugar com ${ranking[userRank - 1].reviews} avaliações e ${ranking[userRank - 1].totalTokens.toFixed(2)} DET!`;
          userRankingElement.classList.add('current-user');
        } else {
          userRankingElement.textContent = 'Você ainda não está no ranking. Comece a avaliar!';
          userRankingElement.classList.remove('current-user');
        }
      }
    }

    rankingListElement.innerHTML = '';
    if (ranking.length === 0) {
      rankingListElement.innerHTML = '<tr><td colspan="4">Nenhum usuário no ranking ainda.</td></tr>';
      return;
    }

    ranking.slice(0, 10).forEach((user, index) => {
      const maskedWallet = `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`;
      const rankRow = document.createElement('tr');
      rankRow.className = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
      rankRow.innerHTML = `
        <td>${index + 1}</td>
        <td>${maskedWallet}</td>
        <td>${user.reviews}</td>
        <td>${user.totalTokens.toFixed(2)} DET</td>
      `;
      rankingListElement.appendChild(rankRow);
    });

    if (rankingSortElement && !rankingSortElement.dataset.listener) {
      rankingSortElement.addEventListener('change', updateRankingList);
      rankingSortElement.dataset.listener = 'true';
    }
  }

  // Configurar formulário de envio de produto
  function setupSubmitProductForm() {
    const submitProductForm = document.getElementById('submitProductForm');
    if (!submitProductForm) {
      console.warn("Formulário submitProductForm não encontrado.");
      return;
    }

    submitProductForm.addEventListener('submit', e => {
      e.preventDefault();
      console.log("Enviando formulário de produto...");

      const nameInput = document.getElementById('productName');
      const descriptionInput = document.getElementById('productDescription');
      const imageInput = document.getElementById('productImage');
      const categoryInput = document.getElementById('productCategory');

      if (!nameInput || !descriptionInput || !imageInput || !categoryInput) {
        console.error("Campos do formulário não encontrados.");
        showMessage('Erro: Campos do formulário ausentes.', 'error');
        return;
      }

      const name = nameInput.value.trim();
      const description = descriptionInput.value.trim();
      const image = imageInput.value.trim();
      const category = categoryInput.value;

      console.log("Dados do formulário:", { name, description, image, category });

      if (!name) {
        showMessage('Informe o nome do produto.', 'error');
        return;
      }
      if (!description || description.length < 10) {
        showMessage('A descrição deve ter pelo menos 10 caracteres.', 'error');
        return;
      }
      if (!image) {
        showMessage('Informe uma URL de imagem.', 'error');
        return;
      }
      if (!category) {
        showMessage('Selecione uma categoria.', 'error');
        return;
      }

      const productData = {
        name,
        description,
        image,
        category,
        wallet: walletAddress || 'test-wallet',
        timestamp: new Date().toLocaleString('pt-BR')
      };

      let localStorageAvailable = true;
      try {
        let products = JSON.parse(localStorage.getItem('products') || '[]');
        if (!Array.isArray(products)) products = [];
        products.push(productData);
        localStorage.setItem('products', JSON.stringify(products));
        console.log("Produto salvo no localStorage:", productData);
      } catch (error) {
        console.error("Erro ao salvar produto no localStorage:", error);
        localStorageAvailable = false;
        inMemoryProducts.push(productData);
        console.log("Produto salvo em inMemoryProducts:", productData);
        showMessage('Produto salvo temporariamente (armazenamento local bloqueado).', 'success');
      }

      showMessage('Seu produto foi enviado com sucesso!', 'success');
      submitProductForm.reset();

      // Redirecionar para evaluate.html
      setTimeout(() => {
        window.location.href = 'evaluate.html';
      }, 1000);
    });
  }

  // Exibir mensagem
  function showMessage(text, type) {
    const messageElement = document.getElementById('formMessage');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
        messageElement.style.display = 'none';
      }, 3000);
    } else {
      console.warn("Elemento formMessage não encontrado.");
      alert(text);
    }
  }
});