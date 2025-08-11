/**
 * Background script for DSA Prep Extension
 * Handles cookie extraction from LeetCode
 */

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_LEETCODE_COOKIE") {
    getLeetCodeCookie()
      .then((cookie) => {
        sendResponse({ success: true, cookie: cookie });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  }

  if (message.type === "GET_USER_INFO") {
    getLeetCodeUserInfo(message.cookie)
      .then((userInfo) => {
        if (userInfo) {
          sendResponse({ success: true, userInfo: userInfo });
        } else {
          sendResponse({ success: false, error: "Failed to get user info" });
        }
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

/**
 * Extract LeetCode session cookie
 */
async function getLeetCodeCookie() {
  try {
    const cookie = await chrome.cookies.get({
      // get the cookie from the url
      url: "https://leetcode.com",
      name: "LEETCODE_SESSION",
    });

    if (cookie) {
      console.log("✅ Found LeetCode session cookie");
      return cookie.value;
    } else {
      throw new Error(
        "No LeetCode session found. Please log in to LeetCode first."
      );
    }
  } catch (error) {
    console.error("❌ Error getting LeetCode cookie:", error);
    throw error;
  }
}

/**
 * Optional: Get user info from cookie to verify
 */
async function getLeetCodeUserInfo(cookieValue) {
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${cookieValue}`,
      },
      body: JSON.stringify({
        query: `
          query {
            user {
              username
            }
          }
        `,
      }),
    });

    const data = await response.json();
    return data.data?.user || null;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}
