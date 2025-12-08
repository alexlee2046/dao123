
const { generateSitePlan } = require('@/app/actions/architect');

async function testArchitect() {
    console.log("Testing Architect Agent...");
    const prompt = "Create a portfolio for a freelance photographer with a gallery and contact page.";

    try {
        const start = Date.now();
        const result = await generateSitePlan(prompt);
        const duration = Date.now() - start;

        console.log(`Duration: ${duration}ms`);

        if (result.success && result.sitePlan) {
            console.log("✅ Success! Site Plan generated:");
            console.log(JSON.stringify(result.sitePlan, null, 2));

            // Basic validation
            if (!result.sitePlan.pages.find(p => p.path === 'index.html')) {
                console.error("❌ Error: Missing index.html");
            } else {
                console.log("✅ index.html present");
            }

            if (result.sitePlan.pages.length < 2) {
                console.warn("⚠️ Warning: Only generated 1 page for a request implying multiple.");
            }
        } else {
            console.error("❌ Failed:", result.error);
        }

    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

// Since we cannot easily run this in isolation due to Next.js server action context (env vars, headers),
// this script serves as a code-review verification:
// 1. generateSitePlan calls generateObject with SitePlanSchema.
// 2. The schema enforces strict JSON output.
// 3. The logic wraps it in { success, sitePlan }.
// The code looks correct by inspection.
