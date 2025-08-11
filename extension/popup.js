/**
 * Popup script for DSA Prep Extension
 * Handles user interactions and communication with background script
 */

document.addEventListener("DOMContentLoaded", function () {
  const syncButton = document.getElementById("syncButton");
  const statusDiv = document.getElementById("status");

  // Handle sync button click
  syncButton.addEventListener("click", handleSync);

  async function handleSync() {
    try {
      // Disable button and show loading
      setLoadingState(true);
      showStatus("Getting LeetCode cookie...", "loading");

      // Request cookie from background script
      const response = await chrome.runtime.sendMessage({
        type: "GET_LEETCODE_COOKIE",
      });

      if (response.success) {
        const cookie = response.cookie;
        console.log("✅ Got cookie from background");

        //----------------------------------------------

        // Get user info using the cookie
        showStatus("Getting user info...", "loading");
        const userResponse = await chrome.runtime.sendMessage({
          type: "GET_USER_INFO",
          cookie: cookie,
        });

        if (userResponse.success) {
          const userInfo = userResponse.userInfo;
          console.log("✅ Got user info:", userInfo);
          showStatus(`✅ Synced for user: ${userInfo.username}`, "success");

          // TODO: Add API call to send data to backend
          // await fetch('http://localhost:3000/api/sync-leetcode', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({
          //     cookie: cookie,
          //     username: userInfo.username
          //   })
          // });
        } else {
          console.log("⚠️ Could not get user info:", userResponse.error);
          showStatus("✅ Cookie retrieved (no user info)", "success");
        }
      } else {
        throw new Error(response.error || "Failed to get cookie");
      }
    } catch (error) {
      console.error("❌ Sync failed:", error);
      showStatus(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Update UI loading state
   */
  function setLoadingState(isLoading) {
    syncButton.disabled = isLoading;
    syncButton.textContent = isLoading ? "Syncing..." : "Sync LeetCode Data";
  }

  /**
   * Show status message
   */
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove("hidden");

    // Auto-hide success/error messages after 3 seconds
    if (type !== "loading") {
      setTimeout(() => {
        statusDiv.classList.add("hidden");
      }, 3000);
    }
  }
});
