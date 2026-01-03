
const GOOGLE_API_KEY = "AIzaSyBjT6OCa222_-Eh6kUFM0ljNmazGHXjNQg";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

async function test() {
    console.log("Testing API Key:", GOOGLE_API_KEY.substring(0, 10) + "...");
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
        })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
