// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("=== main.js Loaded ===");

  // Initialize wallet state
  let walletAddress = localStorage.getItem('walletAddress') || null;
  updateWalletUI();
  updateStakedTokens();
  updateProfilePage();
  loadProducts();
  updateRankingList();
  loadProductDetails();

  // Update wallet UI across pages
  function updateWalletUI() {
    console.log("Atualizando UI da carteira...");
    const walletBtn = document.getElementById('connectWallet');
    if (walletBtn) {
      if (walletAddress) {
        walletBtn.textContent = 'Desconectar';
        walletBtn.classList.add('connected', 'btn-secondary');
        walletBtn.classList.remove('btn-primary');
      } else {
        walletBtn.textContent = 'Conectar Carteira';
        walletBtn.classList.remove('connected', 'btn-secondary');
        walletBtn.classList.add('btn-primary');
      }
      checkReviewedProducts();
    }
  }

  // Get user data by wallet address
  function getUserData(walletAddress) {
    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    return walletsData[walletAddress] || { balance: 0, reviews: [], stakes: [] };
  }

  // Save user data by wallet address
  function saveUserData(walletAddress, data) {
    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    walletsData[walletAddress] = data;
    localStorage.setItem('walletsData', JSON.stringify(walletsData));
  }

  // Clear wallet address
  function clearWalletAddress() {
    localStorage.removeItem('walletAddress');
  }

  // Count reviews for a product
  function countProductReviews(productName) {
    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    let count = 0;
    Object.values(walletsData).forEach(userData => {
      if (userData.reviews) {
        count += userData.reviews.filter(review => review.product === productName).length;
      }
    });
    return count;
  }

  // Wallet Connection/Disconnection
  const connectWalletBtn = document.getElementById('connectWallet');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      if (walletAddress) {
        walletAddress = null;
        clearWalletAddress();
        alert('Carteira desconectada!');
        updateWalletUI();
        updateStakedTokens();
        updateProfilePage();
        updateRankingList();
        loadProductDetails();
      } else {
        if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
          window.solana.connect()
            .then((resp) => {
              walletAddress = resp.publicKey.toString();
              localStorage.setItem('walletAddress', walletAddress);
              const userData = getUserData(walletAddress);
              if (!userData.balance && !userData.reviews && !userData.stakes) {
                userData.balance = 0;
                userData.reviews = [];
                userData.stakes = [];
                saveUserData(walletAddress, userData);
              }
              alert(`Conectado à Phantom Wallet: ${walletAddress}`);
              updateWalletUI();
              updateStakedTokens();
              updateProfilePage();
              updateRankingList();
              loadProductDetails();
            })
            .catch((err) => {
              console.error('Erro ao conectar:', err);
              alert('Falha ao conectar à Phantom Wallet: ' + err.message);
            });
        } else {
          alert('Por favor, instale a Phantom Wallet!');
          window.open('https://phantom.app/', '_blank');
        }
      }
    });
  }

  // Check reviewed products
  function checkReviewedProducts() {
    if (!walletAddress) return;
    const userData = getUserData(walletAddress);
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const productName = card.querySelector('h3').textContent;
      const selectBtn = card.querySelector('.btn-select');
      const hasReviewed = userData.reviews.some(review => review.product === productName);
      if (hasReviewed && selectBtn) {
        selectBtn.classList.add('disabled');
        selectBtn.textContent = '✓ Já Avaliado';
        selectBtn.removeEventListener('click', toggleReviewForm);
      } else if (selectBtn) {
        selectBtn.classList.remove('disabled');
        selectBtn.textContent = 'Ver Detalhes';
        selectBtn.addEventListener('click', toggleReviewForm);
      }
    });

    // Check review button on product.html
    const reviewButton = document.getElementById('reviewButton');
    const productName = document.getElementById('productName')?.textContent;
    if (reviewButton && productName) {
      const hasReviewed = userData.reviews.some(review => review.product === productName);
      if (hasReviewed) {
        reviewButton.classList.add('disabled');
        reviewButton.textContent = '✓ Já Avaliado';
      } else {
        reviewButton.classList.remove('disabled');
        reviewButton.textContent = 'Avaliar Produto';
      }
    }
  }

  // Toggle review form
  function toggleReviewForm(e) {
    e.preventDefault();
    const card = e.target.closest('.product-card');
    const selectBtn = card.querySelector('.btn-select');
    if (card && selectBtn) {
      card.classList.toggle('review-active');
      selectBtn.textContent = card.classList.contains('review-active') ? 'Voltar' : 'Ver Detalhes';
    }
  }

  // Load products dynamically
  function loadProducts() {
    console.log("=== Carregando Produtos ===");
    const productList = document.querySelector('.product-list');
    if (!productList) return;

    productList.innerHTML = '';
    let userProducts = [];
    try {
      userProducts = JSON.parse(localStorage.getItem('products') || '[]');
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }

    if (userProducts.length === 0) {
      productList.innerHTML = '<p>Nenhum produto disponível.</p>';
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
            <span class="review-count"><i class="fas fa-star"></i> ${reviewCount} Avaliação${reviewCount !== 1 ? 'ões' : ''}</span>
            <span class="read-more">Ler mais</span>
            <a href="product.html?name=${encodeURIComponent(product.name)}" class="btn btn-select">Ver Detalhes</a>
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

    checkReviewedProducts();
    attachReviewFormListeners();
  }

  // Attach listeners to review forms
  function attachReviewFormListeners() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      const reviewForm = card.querySelector('.review-form form');
      if (!reviewForm) return;

      const stars = reviewForm.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const rating = star.getAttribute('data-value');
          stars.forEach(s => {
            s.classList.toggle('selected', s.getAttribute('data-value') <= rating);
          });
        });
      });

      const thumbs = reviewForm.querySelectorAll('.thumb');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('selected'));
          thumb.classList.add('selected');
        });
      });

      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!walletAddress) {
          alert('Por favor, conecte sua carteira primeiro!');
          return;
        }

        const productName = card.querySelector('h3').textContent;
        const reviewText = reviewForm.querySelector('textarea').value.trim();
        const selectedStars = reviewForm.querySelectorAll('.star.selected').length;
        const selectedThumb = reviewForm.querySelector('.thumb.selected');
        const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positivo' : 'Negativo') : null;

        if (!reviewText || reviewText.length < 10) {
          alert('A avaliação deve ter pelo menos 10 caracteres.');
          return;
        }
        if (selectedStars === 0) {
          alert('Selecione uma classificação por estrelas.');
          return;
        }
        if (!thumbType) {
          alert('Selecione um sentimento (polegar para cima ou para baixo).');
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
        loadProductDetails();
      });
    });

    // Product review form listener
    const productReviewForm = document.getElementById('productReviewForm');
    if (productReviewForm) {
      const stars = productReviewForm.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const value = star.getAttribute('data-value');
          stars.forEach(s => s.classList.toggle('selected', s.getAttribute('data-value') <= value));
        });
      });

      const thumbs = productReviewForm.querySelectorAll('.thumb');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('selected'));
          thumb.classList.add('selected');
        });
      });

      productReviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!walletAddress) {
          alert('Por favor, conecte sua carteira primeiro!');
          return;
        }

        const productName = document.getElementById('productName').textContent;
        const reviewText = productReviewForm.querySelector('textarea').value.trim();
        const selectedStars = productReviewForm.querySelectorAll('.star.selected').length;
        const selectedThumb = productReviewForm.querySelector('.thumb.selected');
        const thumbType = selectedThumb ? (selectedThumb.classList.contains('up') ? 'Positivo' : 'Negativo') : null;

        if (!reviewText || reviewText.length < 10) {
          alert('A avaliação deve ter pelo menos 10 caracteres.');
          return;
        }
        if (selectedStars === 0) {
          alert('Selecione uma classificação por estrelas.');
          return;
        }
        if (!thumbType) {
          alert('Selecione um sentimento (polegar para cima ou para baixo).');
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

        productReviewForm.reset();
        stars.forEach(s => s.classList.remove('selected'));
        thumbs.forEach(t => t.classList.remove('selected'));
        const reviewButton = document.getElementById('reviewButton');
        reviewButton.classList.add('disabled');
        reviewButton.textContent = '✓ Já Avaliado';
        document.getElementById('reviewForm').style.display = 'none';
        loadProductDetails();
        updateStakedTokens();
        updateProfilePage();
        updateRankingList();
      });
    }

    // Review button toggle on product.html
    const reviewButton = document.getElementById('reviewButton');
    if (reviewButton) {
      reviewButton.addEventListener('click', () => {
        if (reviewButton.classList.contains('disabled')) return;
        const reviewForm = document.getElementById('reviewForm');
        reviewForm.style.display = reviewForm.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  // Update staked tokens
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
  }

  // Update profile page
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
            <td><i class="fas fa-thumbs-${review.thumb === 'Positivo' ? 'up thumb-up' : 'down thumb-down'}"></i></td>
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

  // Update ranking list
  function updateRankingList() {
    const rankingListElement = document.getElementById('rankingList');
    const totalReviewsElement = document.getElementById('totalReviews');
    const totalTokensElement = document.getElementById('totalTokens');
    const totalStakedTokensElement = document.getElementById('totalStakedTokens');
    const userRankingElement = document.getElementById('userRanking');
    const rankingSortElement = document.getElementById('rankingSort');

    if (!rankingListElement) return;

    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
    let ranking = Object.keys(walletsData)
      .map(wallet => {
        const userData = walletsData[wallet];
        const totalTokens = userData.reviews.reduce((sum, review) => sum + (review.tokens || 0), 0);
        return {
          wallet,
          reviews: userData.reviews.length,
          totalTokens
        };
      });

    // Calculate community stats
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

    // Sort ranking based on filter
    const sortBy = rankingSortElement ? rankingSortElement.value : 'reviews';
    ranking.sort((a, b) => {
      if (sortBy === 'tokens') {
        return b.totalTokens - a.totalTokens || b.reviews - a.reviews;
      }
      return b.reviews - a.reviews || b.totalTokens - a.totalTokens;
    });

    // Update user ranking
    if (userRankingElement) {
      if (!walletAddress) {
        userRankingElement.textContent = 'Conecte sua carteira para ver sua posição no ranking!';
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

    // Update ranking table
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

    // Add filter listener (avoid duplicates)
    if (rankingSortElement && !rankingSortElement.dataset.listener) {
      rankingSortElement.addEventListener('change', updateRankingList);
      rankingSortElement.dataset.listener = 'true';
    }
  }

  // Load product details for product.html
  function loadProductDetails() {
    const productName = new URLSearchParams(window.location.search).get('name');
    const productTitleElement = document.getElementById('productTitle');
    const productNameElement = document.getElementById('productName');
    const productDescriptionElement = document.getElementById('productDescription');
    const productImageElement = document.getElementById('productImage');
    const productCategoryElement = document.getElementById('productCategory');
    const reviewCountElement = document.getElementById('reviewCount');
    const reviewListElement = document.getElementById('reviewList');
    const reviewProductNameElement = document.getElementById('reviewProductName');

    if (!productName || !productNameElement) return;

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.name === decodeURIComponent(productName));

    if (!product) {
      productNameElement.textContent = 'Produto não encontrado';
      productDescriptionElement.textContent = 'O produto solicitado não está disponível.';
      productTitleElement.textContent = 'Produto não encontrado';
      if (productImageElement) productImageElement.src = '';
      if (productCategoryElement) productCategoryElement.textContent = '';
      if (reviewCountElement) reviewCountElement.textContent = '0';
      if (reviewListElement) reviewListElement.innerHTML = '<tr><td colspan="5">Nenhuma avaliação disponível.</td></tr>';
      return;
    }

    productTitleElement.textContent = product.name;
    productNameElement.textContent = product.name;
    productDescriptionElement.textContent = product.description || 'Sem descrição.';
    productImageElement.src = product.image || 'https://via.placeholder.com/300';
    productCategoryElement.textContent = product.category || 'Sem categoria';
    reviewCountElement.textContent = countProductReviews(product.name);
    reviewProductNameElement.textContent = product.name;

    // Load reviews
    const walletsData = JSON.parse(localStorage.getItem('walletsData') || '{}');
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

    reviewListElement.innerHTML = '';
    if (reviews.length === 0) {
      reviewListElement.innerHTML = '<tr><td colspan="5">Nenhuma avaliação disponível.</td></tr>';
    } else {
      reviews.forEach(review => {
        const maskedWallet = `${review.wallet.slice(0, 6)}...${review.wallet.slice(-4)}`;
        const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${maskedWallet}</td>
          <td>${review.text}</td>
          <td><span class="stars">${stars}</span></td>
          <td><i class="fas fa-thumbs-${review.thumb === 'Positivo' ? 'up thumb-up' : 'down thumb-down'}"></i></td>
          <td>${review.timestamp}</td>
        `;
        reviewListElement.appendChild(row);
      });
    }

    checkReviewedProducts();
  }

  // Withdraw button
  const withdrawBtn = document.getElementById('withdrawTokens');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      alert('Saques estarão disponíveis em breve!');
    });
  }

  // Submit product form
  const submitProductForm = document.getElementById('submitProductForm');
  if (submitProductForm) {
    submitProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!walletAddress) {
        showMessage('Conecte sua carteira primeiro!', 'error');
        return;
      }

      const name = document.getElementById('productName').value.trim();
      const description = document.getElementById('productDescription').value.trim();
      const image = document.getElementById('productImage').value.trim();
      const category = document.getElementById('productCategory').value;

      if (!name) {
        showMessage('Informe o nome do produto.', 'error');
        return;
      }
      if (!description || description.length < 10) {
        showMessage('A descrição deve ter pelo menos 10 caracteres.', 'error');
        return;
      }
      if (description.length > 500) {
        showMessage('A descrição não pode exceder 500 caracteres.', 'error');
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

      const isImageValid = await isValidImageUrl(image);
      if (!isImageValid) {
        showMessage('A URL fornecida não é uma imagem válida.', 'error');
        return;
      }

      const productData = {
        name,
        description,
        image,
        category,
        wallet: walletAddress,
        timestamp: new Date().toLocaleString('pt-BR')
      };

      const products = JSON.parse(localStorage.getItem('products') || '[]');
      products.push(productData);
      localStorage.setItem('products', JSON.stringify(products));

      showMessage('Produto enviado com sucesso!', 'success');
      submitProductForm.reset();
      loadProducts();
    });
  }

  // Show message
  function showMessage(text, type) {
    const messageElement = document.getElementById('formMessage');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
      }, 3000);
    } else {
      alert(text);
    }
  }

  // Validate image URL
  function isValidImageUrl(url) {
    return new Promise((resolve) => {
      try {
        new URL(url);
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        setTimeout(() => resolve(false), 3000);
      } catch (_) {
        resolve(false);
      }
    });
  }
});