(function() {
    // ✅ 사용자님의 Vercel 주소 (확인 완료)
    const CONFIG = {
        API_URL: "https://naverbloganalyze.aiharugro.com/api/upload-stats",
        API_SECRET: "my_secret_1234" // Vercel 환경변수와 똑같이 설정
    };

    console.log("🚀 [AI Blog Advisor] 목표 감시 시작!");

    // 1. 상태 표시 버튼 (우측 하단)
    const btn = document.createElement("div");
    btn.innerText = "🟢 감시중";
    btn.style = "position: fixed; bottom: 20px; right: 20px; z-index: 99999; padding: 10px 20px; background: #00C73C; color: white; border-radius: 30px; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: all 0.3s; font-size: 14px;";
    document.body.appendChild(btn);

    function updateStatus(msg, color) {
        btn.innerText = msg;
        btn.style.background = color;
        // 3초 후 다시 대기 상태로
        if(color !== "#00C73C") setTimeout(() => updateStatus("🟢 감시중", "#00C73C"), 3000);
    }

    // 2. 내 서버로 데이터 전송
    function sendData(data, type) {
        updateStatus(`🟡 ${type} 전송...`, "#FFB300");

        fetch(CONFIG.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": CONFIG.API_SECRET },
            body: JSON.stringify({ 
                dataType: type, // 'views' 또는 'visitors'
                data: data 
            })
        })
        .then(res => {
            if (res.ok) updateStatus("✅ 저장 성공!", "#3b82f6");
            else updateStatus("❌ 서버 거부", "#DC2626");
        })
        .catch(() => updateStatus("❌ 통신 에러", "#DC2626"));
    }

    // 3. 네이버 데이터 낚아채기 (핵심!)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = response.url;

        // 🎯 아까 로그에서 찾았던 그 주소들입니다!
        if (url.includes('/integrated-analysis/view-count')) {
            console.log("🎯 조회수 데이터 발견!");
            const clone = response.clone();
            clone.json().then(data => sendData(data, 'views'));
        } 
        else if (url.includes('/integrated-analysis/visit-count')) {
            console.log("🎯 방문자수 데이터 발견!");
            const clone = response.clone();
            clone.json().then(data => sendData(data, 'visitors'));
        }

        return response;
    };
})();