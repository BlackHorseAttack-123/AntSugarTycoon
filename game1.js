function gameLoop() {
    if (dirX === 0 && dirY === 0) { drawGraphics(); return; }

    let headX = antColony[0][0];
    let headY = antColony[0][1];
    let newHead = [headX + dirX, headY + dirY];
    antColony.unshift(newHead);

    if (newHead[0] === sugarX && newHead[1] === sugarY) {
        try { soundBite.play(); } catch(e){}
        sugarX = Math.floor(Math.random() * (WIDTH / SIZE)) * SIZE;
        sugarY = Math.floor(Math.random() * (HEIGHT / SIZE)) * SIZE;
        while (sugarX === nestX && sugarY === nestY) {
            sugarX = Math.floor(Math.random() * (WIDTH / SIZE)) * SIZE;
            sugarY = Math.floor(Math.random() * (HEIGHT / SIZE)) * SIZE;
        }
        
        let scoreNow = updateUI();
        if (scoreNow > highScore) {
            highScore = scoreNow;
            localStorage.setItem("ant_high_score", highScore);
        }
    } else {
        antColony.pop();
    }

    // Gửi đường về tổ kiến (Ô màu nâu ở giữa)
    if (newHead[0] === nestX && newHead[1] === nestY) {
        let carried = antColony.length - 1; // Số đường đang mang trên người
        if (carried > 0) {
            let currentPct = (antColony.length / TOTAL_CELLS) * 100;

            // 💡 CƠ CHẾ SỬA LỖI KHÓA CHỐT:
            // TRƯỜNG HỢP 1: Kho trong tổ CHƯA ĐẦY hẳn ➡️ Cho gửi đường vào kho tích lũy
            if (nestSugar < reqNestSugar) {
                nestSugar += carried;
                if (nestSugar > reqNestSugar) nestSugar = reqNestSugar;
                
                let scoreNow = updateUI();
                if (scoreNow > highScore) {
                    highScore = scoreNow;
                    localStorage.setItem("ant_high_score", highScore);
                }

                // Nếu lượt gửi này làm kho vừa đầy VÀ cùng lúc đó độ dài thân thỏa mãn luôn (Màn 1)
                if (nestSugar === reqNestSugar && currentPct >= reqBodyPct) {
                    stageCleared = true; clearInterval(gameInterval); updateUI(); triggerRoundEnd(); return;
                }
                
                // Nếu kho đầy/chưa đầy nhưng chưa thỏa chỉ tiêu chiều dài ➡️ Reset kiến về 1 đốt đầu để đi nhặt lượt mới
                antColony = [[nestX, nestY]]; 
                dirX = 0; dirY = 0; // Đứng yên tại tổ chờ lệnh xuất phát mới
                currentSpeed = Math.min(3 + Math.floor(nestSugar / 10), 8);
                clearInterval(gameInterval); gameInterval = setInterval(gameLoop, 1000 / currentSpeed);
                return; // 💡 Ngắt hàm tại đây, không cho chạy xuống dưới
            } 
            
            // TRƯỜNG HỢP 2: Kho tổ ĐÃ ĐẦY SẴN RỒI (Dành cho Màn 2 và Màn Cuối)
            else if (nestSugar === reqNestSugar) {
                if (currentPct >= reqBodyPct) {
                    // Nếu chiều dài đạt chỉ tiêu qua màn ➡️ Thắng luôn!
                    stageCleared = true; clearInterval(gameInterval); updateUI(); triggerRoundEnd(); return;
                } else {
                    // 💡 VÁ LỖI CỐT LÕI: Nếu chiều dài CHƯA ĐẠT chỉ tiêu, tổ KHÔNG nhận đường nữa.
                    // Kiến giữ nguyên 100% chuỗi đốt đường vàng trên người chạy xuyên qua tổ như bãi cỏ để đi ăn tiếp, không bị co ngắn lại!
                    updateUI();
                }
            }
        }
    }

    // 💡 ĐÃ SỬA LẠI THEO ĐÚNG CÚ PHÁP MẢNG GỐC CỦA BÀ:
    // Kiểm tra đâm tường hoặc cắn đuôi
    let hitWallOrSelf = (newHead[0] < 0 || newHead[0] >= WIDTH || newHead[1] < 0 || newHead[1] >= HEIGHT ||
        antColony.slice(1).some(seg => seg[0] === newHead[0] && seg[1] === newHead[1]));

    // Kiểm tra xem đầu kiến có húc trúng tảng đá xám nào ở Màn 3 không
    let hitObstacle = false;
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        hitObstacle = obstacles.some(obs => obs[0] === newHead[0] && obs[1] === newHead[1]);
    }

    // Nếu vướng bất kỳ điều kiện thua nào -> GAME OVER!
    if (hitWallOrSelf || hitObstacle) {
        clearInterval(gameInterval); stageCleared = false; triggerRoundEnd(); return;
    }


    drawGraphics();
    updateUI();
}

function drawGraphics() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Vẽ tổ kiến màu nâu (CŨ - GIỮ NGUYÊN)
    ctx.fillStyle = "#8B4513"; ctx.fillRect(nestX, nestY, SIZE, SIZE);
    // Vẽ hạt đường màu trắng (CŨ - GIỮ NGUYÊN)
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(sugarX + 2, sugarY + 2, SIZE - 4, SIZE - 4);
    
    // 💡 CHÈN THÊM VÀO ĐÂY: Vẽ 3 tảng đá cổ đại màu xám đậm dựa trên mảng obstacles
    if (typeof obstacles !== 'undefined' && obstacles.length > 0) {
        ctx.fillStyle = "#555555"; // Màu xám đá tảng
        obstacles.forEach(obs => {
            ctx.beginPath();
            ctx.roundRect(obs[0] + 1, obs[1] + 1, SIZE - 2, SIZE - 2, 6);
            ctx.fill();
        });
    }
    
    antColony.forEach((seg, idx) => {
        let cx = seg[0] + SIZE / 2;
        let cy = seg[1] + SIZE / 2;
        if (idx === 0) {
            ctx.save(); ctx.translate(cx, cy);
            let angle = 0;
            if (dirY > 0) angle = Math.PI;       
            else if (dirX > 0) angle = Math.PI/2;  
            else if (dirX < 0) angle = -Math.PI/2; 
            ctx.rotate(angle); ctx.drawImage(antImg, -SIZE/2, -SIZE/2, SIZE, SIZE); ctx.restore();
        } else {
            ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(cx, cy, SIZE/2 - 4, 0, Math.PI * 2); ctx.fill();
        }
    });
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
            fireworks = [];
            requestAnimationFrame(animateFireworks);
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
            <div style="font-size: 11px; color: #ffb703; text-align: left; background: rgba(0,0,0,0.7); padding: 8px; border-radius: 6px; line-height: 15px; font-weight: normal;">
                <strong>💡 BÍ KÍP PHÁ ĐẢO GAME:</strong><br>
                • Điểm số = Đường các màn trước + Đường trong tổ + Kiến vác.<br>
                • Thua cuộc sẽ phải chơi lại từ <strong>Màn 1</strong>.<br>
                • <strong>Màn 1:</strong> Gom đủ 10 hạt đường vào tổ.<br>
                • <strong>Màn 2:</strong> Gom đủ 20 hạt đường + Thân dài ≥ 50% bãi cỏ.<br>
                • <strong>Màn Cuối:</strong> Gom đủ 30 hạt đường + Thân dài phủ kín 100% bãi cỏ!
            </div><br>
            <span style="font-size: 13px; color: #fff; font-weight: bold;">👉 Chạm màn hình để PHỤC THÙ</span>
        `;
        document.getElementById("msg-screen").style.background = "rgba(120,0,0,0.95)";
        document.getElementById("msg-screen").style.display = "flex";
    }
}

document.getElementById("msg-screen").addEventListener("click", () => {
    let titleText = document.getElementById("msg-title").innerText;
    let subHtml = document.getElementById("msg-sub").innerHTML;
    
    if (stageCleared) {
        if (currentStage === maxStages) { 
            currentStage = 1; 
            sugarFromPreviousStages = 0; 
        } else { 
            currentStage++; 
        }
        initStage(currentStage);
    } else {
        if (titleText.includes("GAME OVER") || subHtml.includes("Vua Kiến")) { 
            currentStage = 1; 
            sugarFromPreviousStages = 0; 
            initStage(currentStage);
        } else {
            document.getElementById("msg-screen").style.display = "none";
            try { musicBg.play(); } catch(e){}
            clearInterval(gameInterval); gameInterval = setInterval(gameLoop, 1000 / currentSpeed);
        }
    }
});

document.getElementById("btn-up").addEventListener("click", () => { 
    if (dirY === 0 && (antColony.length <= 1 || dirY !== SIZE)) { dirX = 0; dirY = -SIZE; } 
});
document.getElementById("btn-down").addEventListener("click", () => { 
    if (dirY === 0 && (antColony.length <= 1 || dirY !== -SIZE)) { dirX = 0; dirY = SIZE; } 
});
document.getElementById("btn-left").addEventListener("click", () => { 
    if (dirX === 0 && (antColony.length <= 1 || dirX !== SIZE)) { dirX = -SIZE; dirY = 0; } 
});
document.getElementById("btn-right").addEventListener("click", () => { 
    if (dirX === 0 && (antColony.length <= 1 || dirX !== -SIZE)) { dirX = SIZE; dirY = 0; } 
});

initStage(1);
