function gameLoop(timestamp) {
    if (document.getElementById("msg-screen").style.display !== "none") return;

    gameInterval = requestAnimationFrame(gameLoop);

    let moveDelay = 1000 / currentSpeed; 
    if (timestamp - lastMoveTime < moveDelay) return; 
    lastMoveTime = timestamp;

    if (dirX === 0 && dirY === 0) { drawGraphics(); return; }

    const [headX, headY] = antColony;
    let newHead = [headX + dirX, headY + dirY];
    antColony.unshift(newHead);

    let isHittingSugar = (newHead[0] === sugarX && newHead[1] === sugarY);

    if (isHittingSugar) {
        try { soundBite.play(); } catch(e){}
        spawnSugar();
        let scoreNow = updateUI();
        if (scoreNow > highScore) { highScore = scoreNow; localStorage.setItem("ant_high_score", highScore); }
    } else {
        antColony.pop(); 
    }

    if (newHead[0] === nestX && newHead[1] === nestY) {
        let carried = antColony.length - 1; 
        if (carried > 0) {
            let currentPct = (antColony.length / TOTAL_CELLS) * 100;

            if (nestSugar < reqNestSugar) {
                let needed = reqNestSugar - nestSugar;
                if (carried <= needed) {
                    nestSugar += carried; antColony = [[nestX, nestY]]; 
                } else {
                    nestSugar = reqNestSugar; 
                    let piecesToKeep = 1 + (carried - needed);
                    antColony = antColony.slice(0, piecesToKeep);
                }
                let scoreNow = updateUI();
                if (scoreNow > highScore) { highScore = scoreNow; localStorage.setItem("ant_high_score", highScore); }

                let newPct = (antColony.length / TOTAL_CELLS) * 100;
                if (nestSugar === reqNestSugar && newPct >= reqBodyPct) {
                    stageCleared = true; cancelAnimationFrame(gameInterval); updateUI(); triggerRoundEnd(); return;
                }
                currentSpeed = Math.min(3 + Math.floor(nestSugar / 10), 8);
                dirX = 0; dirY = 0; drawGraphics(); return; 
            } 
            else if (nestSugar === reqNestSugar) {
                if (currentPct >= reqBodyPct) {
                    stageCleared = true; cancelAnimationFrame(gameInterval); updateUI(); triggerRoundEnd(); return;
                } else { updateUI(); }
            }
        }
    }

    // Kiểm tra đâm tường hoặc tự cắn đuôi (CŨ - GIỮ NGUYÊN THEO MÁY CỦA BÀ)
    let hitWallOrSelf = (newHead[0] < 0 || newHead[0] >= WIDTH || newHead[1] < 0 || newHead[1] >= HEIGHT ||
        antColony.slice(1).some(seg => seg[0] === newHead[0] && seg[1] === newHead[1]));

    // 💡 ĐÃ SỬA CHUẨN CÚ PHÁP CHỈ SỐ MẢNG 0 VÀ 1:
    // Kiểm tra xem đầu kiến có húc trúng tảng đá xám nào ở Màn 3 không
    let hitObstacle = false;
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        hitObstacle = obstacles.some(obs => obs[0] === newHead[0] && obs[1] === newHead[1]);
    }

    // Nếu vướng bất kỳ điều kiện thua nào -> GAME OVER!
    if (hitWallOrSelf || hitObstacle) {
        isGameOver = true; // 💡 CHÈN THÊM DÒNG NÀY: Bật cờ báo vừa bị thua cuộc!
        clearInterval(gameInterval); 
        stageCleared = false; 
        triggerRoundEnd(); 
        return;
    }

    drawGraphics();
}

function drawGraphics() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Vẽ tổ kiến màu nâu (CŨ - GIỮ NGUYÊN)
    ctx.fillStyle = "#8B4513"; ctx.fillRect(nestX, nestY, SIZE, SIZE);
    // Vẽ hạt đường màu trắng (CŨ - GIỮ NGUYÊN)
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(sugarX + 2, sugarY + 2, SIZE - 4, SIZE - 4);
    
    // 💡 CHÈN THÊM VÀO ĐÂY: Vẽ 3 tảng đá cổ đại dựa trên mảng obstacles dùng chỉ số 0 và 1
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        ctx.fillStyle = "#555555"; // Màu xám đá tảng
        obstacles.forEach(obs => {
            ctx.beginPath();
            ctx.roundRect(obs[0] + 1, obs[1] + 1, SIZE - 2, SIZE - 2, 6);
            ctx.fill();
        });
    }


    // Vẽ chuỗi hạt đường vàng nối đuôi
    ctx.fillStyle = "#FFD700";
    for (let i = 1; i < antColony.length; i++) {
        ctx.beginPath(); ctx.arc(antColony[i][0] + SIZE / 2, antColony[i][1] + SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2); ctx.fill();
    }

    // Vẽ đầu kiến độc quyền
    if (antColony.length > 0) {
        let cx = antColony[0][0] + SIZE / 2;
        let cy = antColony[0][1] + SIZE / 2;
        ctx.save(); ctx.translate(cx, cy);
        let angle = 0;
        if (dirY > 0) angle = Math.PI;       
        else if (dirX > 0) angle = Math.PI / 2;  
        else if (dirX < 0) angle = -Math.PI / 2; 
        ctx.rotate(angle);
        if (antImg.complete && antImg.naturalWidth !== 0) {
            ctx.drawImage(antImg, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
        } else {
            ctx.fillStyle = "#321405";
            ctx.beginPath(); ctx.arc(0, 4, SIZE / 2 - 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, -4, SIZE / 2 - 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#190a02"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-6, -12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(6, -12); ctx.stroke();
        }
        ctx.restore();
    }
}

function triggerRoundEnd() {
    musicBg.pause();
    let carried = antColony.length - 1;
    if (carried < 0) carried = 0;
    let finalScoreOnEnd = sugarFromPreviousStages + nestSugar + carried;
    
    if (stageCleared) {
        sugarFromPreviousStages += nestSugar;
        if (currentStage === maxStages) {
            try { soundCongrat.play(); } catch(e){}
            document.getElementById("msg-title").innerText = `VICTORY! PHÁ ĐẢO GAME! 🎆`;
            document.getElementById("msg-sub").innerHTML = `
                <span style="font-size: 14px; color: #00ffff; font-weight: bold;">Tổng số điểm đạt được: ${finalScoreOnEnd}</span><br><br>
                <span style="font-size: 12px; color: #fff;">Bà đã xuất sắc trở thành Vua Kiến Tycoon!</span><br><br>
                <span style="font-size: 13px; color: #ffb703; font-weight: bold;">👉 Chạm màn hình để chơi lại từ đầu</span>
            `;
            document.getElementById("msg-screen").style.background = "rgba(15,15,25,0.85)";
            document.getElementById("msg-screen").style.display = "flex";
            startFireworks();
        } else {
            document.getElementById("msg-title").innerText = "THẮNG MÀN RỒI! 🎉";
            document.getElementById("msg-sub").innerText = "Chạm màn hình để qua màn tiếp theo";
            document.getElementById("msg-screen").style.background = "rgba(0,100,0,0.85)";
            document.getElementById("msg-screen").style.display = "flex";
        }
    } else {
        try { soundGameOver.play(); } catch(e){}
        document.getElementById("msg-title").innerText = "GAME OVER 💀";
        document.getElementById("msg-title").style.color = "#ff0000";
        document.getElementById("msg-sub").innerHTML = `
            <span style="font-size: 14px; color: #fff; font-weight: bold;">Điểm số lượt này của bà: ${finalScoreOnEnd}</span><br><br>
            <div style="font-size: 11px; color: #ffb703; text-align: left; background: rgba(0,0,0,0.7); padding: 8px; border-radius: 6px; line-height: 16px; font-weight: normal;">
                <strong>🏆 BÍ KÍP ĐẠT ĐIỂM CAO NHẤT:</strong><br>
                • Điểm số được <strong>cộng dồn liên tục</strong> xuyên suốt qua các màn chơi.<br>
                • Công thức tính: <strong>Đường các màn trước + Đường trong tổ màn này + Chuỗi hạt đường kiến đang vác trên người</strong>.<br>
                • Mẹo: Hãy cố gắng nuôi đàn kiến thật dài, ăn nhiều đường ngoài bãi cỏ trước khi gửi vào tổ để tối ưu hóa điểm số kỷ lục tối đa!<br>
                • <em>Lưu ý: Thua cuộc sẽ phải chơi lại từ Màn 1.</em>
            </div><br>
            <span style="font-size: 13px; color: #fff; font-weight: bold;">👉 Chạm màn hình để PHỤC THÙ</span>
        `;
        document.getElementById("msg-screen").style.background = "rgba(120,0,0,0.95)";
        document.getElementById("msg-screen").style.display = "flex";
    }
}

// 💡 BẢN CẬP NHẬT CHỐT HẠ: Ép game chạy đúng luồng hoạt họa mượt mà, giải cứu kiến chạy lẹ
document.getElementById("msg-screen").addEventListener("click", () => {
    
    if (stageCleared) {
        if (currentStage === maxStages) { 
            currentStage = 1; 
            sugarFromPreviousStages = 0; // Phá đảo -> Reset tổng điểm chơi ván mới
        } else { 
            currentStage++; 
        }
        initStage(currentStage);
        return; // Ngắt luồng dứt khoát
    } 
    else if (typeof isGameOver !== 'undefined' && isGameOver === true) {
        currentStage = 1; 
        sugarFromPreviousStages = 0; // Thua cuộc -> Reset về Màn 1 phục thù
        isGameOver = false;          // Reset lại cờ trạng thái chết
        initStage(currentStage);
        return;
    } 
    else {
        // 💡 ĐÃ SỬA: Ẩn màn che, bật nhạc và gọi vòng lặp hoạt họa chuẩn, KHÔNG dùng setInterval gây chạy lố nữa!
        document.getElementById("msg-screen").style.display = "none";
        try { musicBg.play(); } catch(e){}
        
        lastMoveTime = performance.now();
        cancelAnimationFrame(gameInterval); 
        gameInterval = requestAnimationFrame(gameLoop); // Chạy bằng luồng phim nhựa 60 FPS siêu mượt, thong thả
    }
});

document.getElementById("btn-up").addEventListener("click", () => { changeDirection("UP"); });
document.getElementById("btn-down").addEventListener("click", () => { changeDirection("DOWN"); });
document.getElementById("btn-left").addEventListener("click", () => { changeDirection("LEFT"); });
document.getElementById("btn-right").addEventListener("click", () => { changeDirection("RIGHT"); });

initStage(1);
