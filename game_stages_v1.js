// Khai báo mảng lưu trữ vị trí các tảng đá cho Màn 3
let obstacles = [];

function initStage(stage) {
    let stageTitle = "";
    let stageGuide = "";
    
    // Reset lại chướng ngại vật mỗi khi vào màn mới
    obstacles = [];
    isGameOver = false; // Init for gameover var


    if (stage === 1) { 
        reqNestSugar = 10; 
        reqBodyPct = 0; 
        stageTitle = "STAGE 1: Tích Trữ Đường";
        stageGuide = "• Đi nhặt các hạt đường xuất hiện ngẫu nhiên ngoài bãi cỏ.<br>• <strong>Bò về Ô màu nâu (Tổ kiến)</strong> để gửi đường vào kho tích lũy.<br>• Thu thập đủ <strong>10 hạt đường</strong> trong tổ để mở khóa qua màn.";
    }
    else if (stage === 2) { 
        reqNestSugar = 20; 
        reqBodyPct = 30; 
        stageTitle = "STAGE 2: Đoàn Kiến Lớn";
        stageGuide = "• Chỉ tiêu kho tổ tăng lên: Tích đủ <strong>20 hạt đường</strong>.<br>• <strong>ĐIỀU KIỆN QUA MÀN:</strong> Sau khi tổ đầy, bà phải lái kiến đi ăn tiếp sao cho <strong>đạt chiều dài ≥ 30% bãi cỏ</strong> rồi mới được bò về tổ để chiến thắng!";
    }
    else { 
        reqNestSugar = 30; 
        reqBodyPct = 60; 
        stageTitle = "FINAL STAGE: Thu Hoạch Tối Thượng";
        stageGuide = "• Thử thách tối thượng của Vua Kiến: Tích đủ <strong>30 hạt đường</strong>.<br>• <strong>⚠️ CẢNH BÁO:</strong> Bãi cỏ xuất hiện <strong>3 tảng đá cổ đại</strong> cản đường!<br>• Sau khi tổ đầy, bà phải kéo đàn kiến <strong>dài phủ kín 60% bãi cỏ</strong> rồi bò về tổ để phá đảo game!";
        
        // 💡 Ý TƯỞNG CỦA BÀ: Tạo 3 tảng đá ngẫu nhiên cho Màn 3
        generateObstacles(3);
    }
    
    document.getElementById("msg-title").innerText = stageTitle;
    document.getElementById("msg-title").style.color = "#00ffff";
    
    document.getElementById("msg-sub").innerHTML = `
        <div style="font-size: 13.5px; color: #ffb703; text-align: left; background: rgba(0,0,0,0.65); padding: 16px 20px; border-radius: 10px; line-height: 22px; font-weight: normal; margin: 10px auto 25px auto; width: 98% !important; box-sizing: border-box; border: 1px solid rgba(255,183,3,0.25); box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <strong style="font-size: 15px; color: #fff; display: block; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 4px;">📋 NHIỆM VỤ CỦA BÀ:</strong>
            ${stageGuide}
        </div>
        <span class="blink-text" style="color: #fff; font-weight: bold; font-size: 15px;">👉 Chạm màn hình để BẮT ĐẦU</span>
    `;
    
    document.getElementById("msg-screen").style.background = "#323232";
    document.getElementById("msg-screen").style.display = "flex";
    
    let startX = nestX;
    let startY = nestY + SIZE;
    antColony = [[startX, startY]]; 
    
    dirX = 0; dirY = 0; 
    nestSugar = 0; currentSpeed = 3;
    stageActive = false; stageCleared = false;
    spawnSugar();
    updateUI();
}

// Hàm sinh đá tảng ngẫu nhiên thông minh, né tổ và né vị trí đứng của kiến
function generateObstacles(count) {
    while (obstacles.length < count) {
        let obsX = Math.floor(Math.random() * (WIDTH / SIZE)) * SIZE;
        let obsY = Math.floor(Math.random() * (HEIGHT / SIZE)) * SIZE;
        
        // Né tổ kiến tuyệt đối
        if (obsX === nestX && obsY === nestY) continue;
        
        // Né vị trí hồi sinh đứng yên của con kiến (120, 150)
        if (obsX === nestX && obsY === (nestY + SIZE)) continue;
        
        // Tránh trùng các tảng đá đã bốc thăm trước đó
        let isOverlap = obstacles.some(obs => obs[0] === obsX && obs[1] === obsY);
        if (isOverlap) continue;
        
        obstacles.push([obsX, obsY]);
    }
}

function spawnSugar() {
    let checkOverlap = true;
    while (checkOverlap) {
        sugarX = Math.floor(Math.random() * (WIDTH / SIZE)) * SIZE;
        sugarY = Math.floor(Math.random() * (HEIGHT / SIZE)) * SIZE;

        // Tầng 1: Né tổ kiến tuyệt đối
        if (sugarX === nestX && sugarY === nestY) continue;

        // Tầng 2: Né toàn bộ cơ thể và đuôi kiến bằng biến bóc tách chữ
        let isTouchingBody = false;
        for (let i = 0; i < antColony.length; i++) {
            const [segX, segY] = antColony[i];
            if (sugarX === segX && sugarY === segY) { 
                isTouchingBody = true; 
                break; 
            }
        }
        if (isTouchingBody) continue; // Trùng thân kiến -> Bốc lại số khác
        
        // 💡 TẦNG 3 CHỐT CHẶN: Chặn hạt đường không cho mọc đè lên các tảng đá xám
        let isTouchingObs = obstacles.some(obs => obs[0] === sugarX && obs[1] === sugarY);
        if (isTouchingObs) continue; // Trùng đá -> Ép vòng lặp quay lại bốc số khác liền!

        // Vượt qua hết tất cả các tầng kiểm tra nghiêm ngặt -> Hợp lệ, cho mọc đường!
        checkOverlap = false;
    }
}

