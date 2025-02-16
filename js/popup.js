document.addEventListener("DOMContentLoaded", () => {
    const getActiveTabUrl = (callback) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                callback(tabs[0].url);
            } else {
                showStatus("No active tab found! ❌", false);
            }
        });
    };

    document.getElementById("getCookies").addEventListener("click", function () {
        getActiveTabUrl((targetUrl) => {
            getCookieString(targetUrl);
            showStatus("Cookies retrieved successfully! ✅", true)
        });
    });

    document.getElementById("clearCookies").addEventListener("click", function () {
        getActiveTabUrl(async (targetUrl) => {
            await clearCookies(targetUrl);
            showStatus("Cookies cleared successfully! 🗑️", true);
        });
    });

    document.getElementById("updateCookies").addEventListener("click", function () {
        const cookieStr = document.getElementById("cookieString").value;
        if (!cookieStr.trim()) {
            showStatus("Please enter a valid cookie string! ❌", false);
            return;
        }

        getActiveTabUrl(async (targetUrl) => {
            await updateCookies(targetUrl, cookieStr);
            showStatus("Cookies updated successfully! 🔄", true);
        });
    });

    document.getElementById("copyCookies").addEventListener("click", async () => {
        const cookieStr = document.getElementById("cookieString").value;
        if (!cookieStr.trim()) {
            showStatus("There are no cookies to copy! ❌", false);
            return;
        }
        try {
            await navigator.clipboard.writeText(cookieStr);
            showStatus("Cookies copied to clipboard! 📋", true);
        } catch (err) {
            showStatus("Failed to copy cookies! ❌", false);
        }
    });
});

function getCookieString(url) {
    chrome.cookies.getAll({ url }, (cookies) => {
        if (chrome.runtime.lastError) {
            showStatus("Failed to retrieve cookies! ❌", false);
            return;
        }
        if (cookies.length === 0) {
            showStatus("No cookies found! 🍪❌", false);
            return;
        }
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
        document.getElementById("cookieString").value = cookieString;
    });
}

async function clearCookies(url) {
    return new Promise((resolve) => {
        chrome.cookies.getAll({ url }, (cookies) => {
            if (chrome.runtime.lastError) {
                showStatus("Failed to clear cookies! ❌", false);
                resolve();
                return;
            }

            const deletions = cookies.map(cookie => {
                return new Promise((resolveDelete) => {
                    chrome.cookies.remove({ url, name: cookie.name }, () => {
                        if (chrome.runtime.lastError) {
                            showStatus("Failed to clear cookies! ❌", false);
                        }
                        resolveDelete();
                    });
                });
            });
            Promise.all(deletions).then(resolve);
        });
    });
}

async function updateCookies(url, cookieString) {
    const cookiesArr = cookieString.split(";").map(item => item.trim()).filter(item => item);
    
    if (cookiesArr.length === 0) {
        showStatus("Please enter a valid cookie string! ❌", false);
        return;
    }

    await clearCookies(url);

    const setCookies = cookiesArr.map(cookiePair => {
        const [name, value] = cookiePair.split("=");
        return new Promise((resolve) => {
            chrome.cookies.set({ url, name, value, path: "/" }, () => {
                if (chrome.runtime.lastError) {
                    showStatus("Failed to update cookies! ❌", false);
                }
                resolve();
            });
        });
    });

    await Promise.all(setCookies);
}

function showStatus(message, isSuccess) {
    const statusEl = document.getElementById("statusMessage");
    statusEl.textContent = message;
    statusEl.className = `status-message ${isSuccess ? "success" : "error"} visible`;

    setTimeout(() => {
        statusEl.classList.remove("visible");
    }, 5000);
}