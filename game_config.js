const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SIZE = 30;
// 💡 CẬP NHẬT ĐỘ PHÂN GIẢI: Tăng từ 300 lên 450 giúp bãi cỏ rộng thênh thang
const WIDTH = 450, HEIGHT = 450;
const TOTAL_CELLS = (WIDTH / SIZE) * (HEIGHT / SIZE); // Tổng 225 ô

const antImg = new Image();
antImg.src = 'ant.png'; 

const soundBite = new Audio('bite.mp3');
const soundGameOver = new Audio('gameover.mp3');
const soundCongrat = new Audio('congratulation.mp3');
const musicBg = new Audio('bg_music.mp3');
musicBg.loop = true; musicBg.volume = 0.4;

let currentStage = 1, maxStages = 3;
let reqNestSugar = 10, reqBodyPct = 0;

// 💡 CẬP NHẬT TỌA ĐỘ TỔ KIẾN: Đưa tổ về chính giữa b bãi cỏ rộng 450 (ô lưới số 7,7)
let nestX = 210, nestY = 210; 

let antColony = [];
let dirX = 0, dirY = 0; 
let sugarX = 0, sugarY = 0;
let nestSugar = 0, currentSpeed = 2;
let gameInterval = null;
let stageActive = false, stageCleared = false;

// 💡 CẬP NHẬT: Khai báo thêm biến tổng đường tích lũy qua các màn
let sugarFromPreviousStages = 0; 
let highScore = localStorage.getItem("ant_high_score") || 0;

function updateUI() {
    highScore = localStorage.getItem("ant_high_score") || 0;
    
    // 💡 TÍNH TOÁN THEO Ý BÀ: Tổng điểm hiện tại = Đường các màn trước + Đường trong tổ màn này + Đường trên người kiến
    let carried = antColony.length - 1;
    if (carried < 0) carried = 0;
    let currentTotalScore = sugarFromPreviousStages + nestSugar + carried;
    
    document.getElementById("ui-stage").innerText = "Stage: " + currentStage + "/" + maxStages + " | Kỷ lục: " + highScore;
    document.getElementById("ui-nest").innerText = "Trong Tổ: " + nestSugar + "/" + reqNestSugar + " | Tổng Điểm: " + currentTotalScore;
    let pct = Math.floor((antColony.length / TOTAL_CELLS) * 100);
    document.getElementById("ui-cargo").innerText = "Chiều dài kiến: " + carried + " đốt (" + pct + "% / " + reqBodyPct + "%)";
    
    return currentTotalScore;
}
