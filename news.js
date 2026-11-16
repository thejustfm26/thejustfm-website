// THE JUST FM 98.9 - NEWS CONNECTION

const newsFolder =
    "https://api.github.com/repos/thejustfm26/thejustfm-website/contents/content/news?ref=main";

async function loadJustFMNews() {
    const newsSection = document.getElementById("news");

    if (!newsSection) return;

    const newsContainer = document.createElement("div");
    newsContainer.className = "cms-news-list";
    newsSection.appendChild(newsContainer);

    try {
        const response = await fetch(newsFolder);

        if (!response.ok) {
            throw new Error("Could not access the news folder.");
        }

        const files = await response.json();
        const newsFiles = files.filter(file =>
            file.name.endsWith(".md")
        );

        const articles = await Promise.all(
            newsFiles.map(async file => {
                const articleResponse = await fetch(file.download_url);
                if (!articleResponse.ok) return null;

                const content = await articleResponse.text();
                const match = content.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);

                if (!match) return null;

                const metadata = match[1];
                const body = match[2].trim();

                function getField(field) {
                    const result = metadata.match(
                        new RegExp("^" + field + ":\\s*(.*)$", "m")
                    );

                    return result ? result[1].trim().replace(/^["']|["']$/g, "") : "";
                }

                return {
                    title: getField("title"),
                    date: getField("date"),
                    body: body
                };
            })
        );

        const publishedArticles = articles
            .filter(article => article && article.title)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (publishedArticles.length === 0) {
            newsContainer.textContent = "No news articles have been published yet.";
            return;
        }

        publishedArticles.forEach(article => {
            const card = document.createElement("article");
            card.className = "news-card";

            const heading = document.createElement("h3");
            heading.textContent = article.title;

            const date = document.createElement("p");
            date.className = "news-date";
            date.textContent = article.date;

            const description = document.createElement("p");
            description.textContent = article.body;

            card.append(heading, date, description);
            newsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("THE JUST FM News:", error);
        newsContainer.textContent =
            "News is temporarily unavailable. Please try again later.";
    }
}

loadJustFMNews();
