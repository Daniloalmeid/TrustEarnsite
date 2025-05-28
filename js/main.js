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

  // Validate review with Twinword Sentiment Analysis API (Commented out)
  /*
  async function validateReviewWithAI(reviewText) {
    try {
      const response = await fetch('https://twinword-sentiment-analysis.p.rapidapi.com/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-RapidAPI-Key': '6262f011ecmshc395a7a32629505p197598jsn66a854822ec1',
          'X-RapidAPI-Host': 'twinword-sentiment-analysis.p.rapidapi.com'
        },
        body: new URLSearchParams({
          text: reviewText
        })
      });

      if (!response.ok) {
        console.error('Erro na Twinword:', response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('Resposta da Twinword:', result);
      const score = result.score;
      const type = result.type;
      const isValid = score >= -0.3 && type !== 'negative';
      if (!isValid) {
        console.log('Avaliação inválida:', { score, type });
      }
      return isValid;
    } catch (error) {
      console.error('Erro na validação da Twinword:', error);
      return false;
    }
  }
  */

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
        selectBtn.textContent = 'Avaliar Produto';
        selectBtn.addEventListener('click', toggleReviewForm);
      }
    });
  }

  // Toggle Review Form
  function toggleReviewForm(e) {
    e.preventDefault();
    const card = e.target.closest('.product-card');
    const selectBtn = card.querySelector('.btn-select');
    if (card && selectBtn) {
      card.classList.toggle('review-active');
      selectBtn.textContent = card.classList.contains('review-active') ? 'Voltar' : 'Avaliar Produto';
    }
  }

  // Load products dynamically
  function loadProducts() {
    console.log("=== Carregando Produtos ===");
    const productList = document.querySelector('.product-list');
    if (!productList) {
      console.error("Elemento .product-list não encontrado!");
      return;
    }

    productList.innerHTML = '';
    console.log("Lista de produtos limpa.");

    let userProducts = [];
    try {
      userProducts = JSON.parse(localStorage.getItem('products') || '[]');
      console.log("Produtos do usuário:", userProducts.length);
    } catch (error) {
      console.error("Erro ao carregar produtos do localStorage:", error);
    }

    const allProducts = userProducts;
    console.log("Total de produtos:", allProducts.length);

    if (allProducts.length === 0) {
      productList.innerHTML = '<p>Nenhum produto disponível para avaliação.</p>';
      return;
    }

    const categories = {};
    allProducts.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = [];
      }
      categories[product.category].push(product);
    });

    console.log("Categorias encontradas:", Object.keys(categories));

    Object.keys(categories).forEach(category => {
      console.log(`Renderizando categoria: ${category}`);
      const categorySection = document.createElement('div');
      categorySection.className = 'category-section';
      categorySection.innerHTML = `<h3 class="category-title">${category}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      categorySection.appendChild(grid);
      productList.appendChild(categorySection);

      categories[category].forEach((product, index) => {
        console.log(`  Produto: ${product.name}`);
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
            <button class="btn-select">Enviar Avaliação</button>
          </div>
          <div class="review-form">
            <h4>Avaliar ${product.name}</h4>
            <form>
              <div class="form-group">
                <label for="reviewText${category}_${index}">Sua Avaliação (em inglês)</label>
                <textarea id="reviewText${category}_${index}" rows="2" placeholder="Share your feedback in English..." required></textarea>
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
          console.log(`Descrição ${product.name} ${isExpanded ? 'expandida' : 'recolhida'}`);
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

        /*
        const isValid = await validateReviewWithAI(reviewText);
        if (!isValid) {
          alert('A avaliação contém conteúdo inválido ou muito negativo. Por favor, revise seu texto (use inglês).');
          return;
        }
        */

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
        selectBtn.textContent = '✓ Selecionado!';
        selectBtn.removeEventListener('click', toggleReviewForm);
        card.classList.remove('review-active');
        loadProducts();
        updateStakedTokens();
        updateProfilePage();
        updateRankingList();
      });
    });
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

  // Update Profile Page
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

  // Update Ranking List
  function updateRankingList() {
    const rankingListElement = document.getElementById('rankingList');
    const totalReviewsElement = document.getElementById('totalReviews');
    const totalTokensElement = document.getElementById('totalTokens');
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
    ranking.forEach(user => {
      totalReviews += user.reviews;
      totalTokens += user.totalTokens;
    });

    if (totalReviewsElement) totalReviewsElement.textContent = totalReviews;
    if (totalTokensElement) totalTokensElement.textContent = `${totalTokens.toFixed(2)} DET`;

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
      const row = document.createElement('tr');
      row.className = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${maskedWallet}</td>
        <td>${user.reviews}</td>
        <td>${user.totalTokens.toFixed(2)} DET</td>
      `;
      rankingListElement.appendChild(row);
    });

    // Add filter listener
    if (rankingSortElement) {
      rankingSortElement.addEventListener('change', updateRankingList);
    }
  }

  // Withdraw Button
  const withdrawBtn = document.getElementById('withdrawTokens');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      alert('Saques estarão disponíveis em breve!');
    });
  }

  // Submit Product Form
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
        img.onerror = () => resolve();
        img.src = url;
        setTimeout(() => resolve(false), 3000);
      } catch (_) {
        resolve(false);
      }
    });
  }
});