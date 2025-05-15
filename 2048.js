(() => {
  let intervalId = null;
  const directions = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'];
  let patternMain = ['ArrowLeft', 'ArrowDown'];
  let patternFallback = ['ArrowRight', 'ArrowUp'];
  let moveCount = 0;
  let lastScore = 0;
  let waitingForFaucet = false;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const getScore = () => {
    const el = [...document.querySelectorAll('div')]
      .find(div => /^\d+$/.test(div.textContent.trim()));
    return el ? parseInt(el.textContent.trim()) : 0;
  };

  const isOutOfGas = () => {
    return !![...document.querySelectorAll('div')]
      .find(div => div.textContent.includes('Fund via game faucet') || div.textContent.includes('You need at least 0.1 MON'));
  };

  const clickButtonByText = (text) => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => b.innerText.trim().toLowerCase() === text.toLowerCase() && !b.disabled);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  };

  const waitAndClickButton = async (text, maxWait = 15000) => {
    let waited = 0;
    while (waited < maxWait) {
      const ok = clickButtonByText(text);
      if (ok) return true;
      await sleep(500);
      waited += 500;
    }
    return false;
  };

  const tryAutoFaucet = async () => {
    if (!isOutOfGas()) return false;
    if (waitingForFaucet) return true; // đang xử lý faucet trước đó
    waitingForFaucet = true;

    console.log("⛽ Hết gas → Bắt đầu faucet...");
    clickButtonByText("Fund via game faucet");
    await sleep(500); // tránh double click

    const resumed = await waitAndClickButton("Resume", 20000);
    if (resumed) {
      console.log("▶️ Resume sau faucet thành công");
    } else {
      console.warn("❌ Không tìm thấy nút Resume sau faucet");
    }

    await sleep(1000);
    waitingForFaucet = false;
    return true;
  };

  const clickPlayAgainIfVisible = () => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => b.innerText.trim() === 'Play Again' && !b.disabled);
    if (btn) {
      btn.click();
      console.log("🔁 Game over → Bấm Play Again");
      return true;
    }
    return false;
  };

  const playSmart = async () => {
    if (await tryAutoFaucet()) return;

    const currentScore = getScore();
    const gained = currentScore - lastScore;

    if (gained === 0 && moveCount > 10) {
      // Có thể là game over
      if (clickPlayAgainIfVisible()) {
        moveCount = 0;
        lastScore = 0;
        await sleep(1000);
        return;
      }
    }

    const move = (gained === 0 && moveCount > 4)
      ? patternFallback[moveCount % patternFallback.length]
      : patternMain[moveCount % patternMain.length];

    document.dispatchEvent(new KeyboardEvent('keydown', { key: move, bubbles: true }));
    console.log(`▶️ Move #${moveCount}: ${move}, Score: ${currentScore}, Gain: ${gained}`);

    lastScore = currentScore;
    moveCount++;
  };

  // Add toggle button
  const btn = document.createElement('button');
  btn.textContent = '▶ Start Smart Bot';
  Object.assign(btn.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    zIndex: 9999,
    padding: '10px 16px',
    background: '#28a745',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  });
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      btn.textContent = '▶ Start Smart Bot';
      btn.style.background = '#28a745';
      console.log('⏹ Bot stopped');
    } else {
      lastScore = getScore();
      moveCount = 0;
      intervalId = setInterval(playSmart, 500);
      btn.textContent = '⏸ Stop Bot';
      btn.style.background = '#dc3545';
      console.log('🤖 Bot started');
    }
  });
})();
