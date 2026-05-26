// ==UserScript==
// @name         Auto Pool Verification
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto verify pools every 5-10 minutes
// @match        *://YOUR-WEBSITE.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =========================
    // CONFIG
    // =========================

    // Default values
    let config = {
        minDelay: 5 * 60 * 1000,
        maxDelay: 10 * 60 * 1000,
        selectorDropdown: 'listbox',
        selectorPoolItems: 'Pool verificator',
        selectorVerifyButton: 'button.verify',
        selectorCloseButton: 'button.close'
    };

    async function loadRemoteConfig() {
        try {
            const res = await fetch('http://localhost:8080/main/api/v2/config');
            if (res.ok) {
                const data = await res.json();
                config.minDelay = data.min_delay || config.minDelay;
                config.maxDelay = data.max_delay || config.maxDelay;
                config.selectorDropdown = data.selector_dropdown || config.selectorDropdown;
                config.selectorPoolItems = data.selector_pool_items || config.selectorPoolItems;
                config.selectorVerifyButton = data.selector_verify_button || config.selectorVerifyButton;
                config.selectorCloseButton = data.selector_close_button || config.selectorCloseButton;
                console.log("Config loaded from API:", config);
            }
        } catch (e) { console.warn("Could not fetch remote config, using defaults."); }
    }


    // index pool hiện tại
    let currentIndex = 0;

    // =========================
    // HELPERS
    // =========================

    function randomDelay() {
        return Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function waitForElement(selector, timeout = 30000) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);

            if (el) return el;

            await sleep(1000);
        }

        throw new Error(`Không tìm thấy element: ${selector}`);
    }

    // =========================
    // MAIN LOGIC
    // =========================

    async function processPool() {
        try {
            await loadRemoteConfig(); // Reload config each cycle

            console.log("Bắt đầu process pool:", currentIndex);

            // =========================
            // 1. CLICK DROPDOWN
            // =========================

            const dropdown = await waitForElement(config.selectorDropdown);

            dropdown.click();

            await sleep(2000);

            // =========================
            // 2. LẤY DANH SÁCH ITEM
            // =========================

            const items = document.querySelectorAll(config.selectorPoolItems);

            if (!items.length) {
                console.log("Không có pool");
                return;
            }

            // quay vòng từ trên xuống dưới
            if (currentIndex >= items.length) {
                currentIndex = 0;
            }

            const item = items[currentIndex];

            // scroll tới item
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            await sleep(1500);

            console.log("Chọn pool:", item.innerText);

            item.click();

            await sleep(3000);

            // =========================
            // 3. CLICK "Pool verification"
            // =========================

            const verifyBtn = await waitForElement(config.selectorVerifyButton);

            verifyBtn.click();

            console.log("Đang verify...");

            // =========================
            // 4. ĐỢI THÔNG BÁO COMPLETE
            // =========================

            const successText =
                "Pool verification process is complete. Tested pool is compatible!";

            let success = false;

            for (let i = 0; i < 60; i++) {

                if (document.body.innerText.includes(successText)) {
                    success = true;
                    break;
                }

                await sleep(5000);
            }

            if (!success) {
                console.log("Verify timeout");
                return;
            }

            console.log("Verify thành công");

            // =========================
            // 5. CLICK CLOSE
            // =========================

            const closeBtn = await waitForElement(config.selectorCloseButton);

            closeBtn.click();

            console.log("Đã close");

            // tăng index qua pool tiếp theo
            currentIndex++;

        } catch (err) {
            console.error(err);
        }

        // chạy lại sau 15-18 phút
        const nextDelay = randomDelay();

        console.log(`Chạy lại sau ${Math.round(nextDelay / 60000)} phút`);

        setTimeout(processPool, nextDelay);
    }

    // START
    processPool();

})();