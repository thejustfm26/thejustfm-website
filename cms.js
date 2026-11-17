
// THE JUST FM 98.9 - CENTRAL CMS CONNECTION

const CMS_CONFIG = {
    owner: "thejustfm26",
    repository: "thejustfm-website",
    branch: "full-cms-integration"
};

// Build the GitHub API address
function getCMSFolder(collection) {
    return `https://api.github.com/repos/${CMS_CONFIG.owner}/${CMS_CONFIG.repository}/contents/content/${collection}?ref=${CMS_CONFIG.branch}`;
}

// Retrieve files from a CMS collection
async function getCMSFiles(collection) {
    const response = await fetch(getCMSFolder(collection));

    if (!response.ok) {
        throw new Error(`Unable to load CMS collection: ${collection}`);
    }

    const files = await response.json();

    return files.filter(file => file.name.endsWith(".md"));
}

// Read an individual CMS file
async function readCMSFile(file) {
    const response = await fetch(file.download_url);

    if (!response.ok) {
        throw new Error(`Unable to read file: ${file.name}`);
    }

    return {
        filename: file.name,
        content: await response.text()
    };
}

// Separate YAML metadata from article content
function parseCMSContent(rawContent) {
    const match = rawContent.match(
        /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/
    );

    if (!match) {
        throw new Error("Invalid CMS content format.");
    }

    return {
        metadata: match[1],
        body: match[2].trim()
    };
}

// Parse YAML metadata
function parseCMSMetadata(metadata) {
    return jsyaml.load(metadata) || {};
}

// Load an entire CMS collection
async function loadCMSCollection(collection) {
    const files = await getCMSFiles(collection);

    const records = await Promise.all(
        files.map(async file => {
            try {
                const cmsFile = await readCMSFile(file);
                const parsed = parseCMSContent(cmsFile.content);
                const fields = parseCMSMetadata(parsed.metadata);

                return {
                    ...fields,
                    body: parsed.body,
                    filename: cmsFile.filename
                };

            } catch (error) {
                console.error("CMS file error:", file.name, error);
                return null;
            }
        })
    );

    return records.filter(record => record !== null);
}

// Create a safe text element
function createTextElement(tag, value, className) {
    const element = document.createElement(tag);
    element.textContent = value || "";

    if (className) {
        element.className = className;
    }

    return element;
}

// Create a safe rich-text element
function createRichTextElement(value, className) {
    const element = document.createElement("div");

    if (className) {
        element.className = className;
    }

    if (typeof marked !== "undefined" &&
        typeof DOMPurify !== "undefined") {
        element.innerHTML = DOMPurify.sanitize(
            marked.parse(value || "")
        );
    } else {
        element.textContent = value || "";
    }

    return element;
}


// Display programmes
async function displayProgrammes() {
    const section = document.getElementById("programmes");
    if (!section) return;

    const container = document.createElement("div");
    container.className = "cms-programme-list";

    section.appendChild(container);

    try {
        const programmes = await loadCMSCollection("programmes");

        if (programmes.length === 0) {
            container.textContent = "No programmes available.";
            return;
        }

        programmes.forEach(programme => {
            const card = document.createElement("article");
            card.className = "partner-card";

            card.appendChild(
                createTextElement("h3", programme.title)
            );

            if (programme.presenter) {
                card.appendChild(
                    createTextElement("p", `Presenter: ${programme.presenter}`)
                );
            }

            if (programme.schedule) {
                card.appendChild(
                    createTextElement("p", `Schedule: ${programme.schedule}`)
                );
            }

            if (programme.description) {
    card.appendChild(
        createRichTextElement(programme.description, "programme-description")
    );
}

            container.appendChild(card);
        });

    } catch (error) {
        console.error("CMS Programmes:", error);
        container.textContent = "Programmes are temporarily unavailable.";
    }
}


// Display news
async function displayNews() {
    const section = document.getElementById("news");
    if (!section) return;

    const container = document.createElement("div");
    container.className = "cms-news-list";

    section.appendChild(container);

    try {
        const articles = await loadCMSCollection("news");

        articles.sort((a, b) =>
            new Date(b.date || 0) - new Date(a.date || 0)
        );

        if (articles.length === 0) {
            container.textContent = "No news articles published yet.";
            return;
        }

        articles.forEach(article => {
            if (!article.title) return;

            const card = document.createElement("article");
            card.className = "news-card";

            // Display news image when available
            if (article.image) {
                const image = document.createElement("img");

                image.src = /^https?:\/\//i.test(article.image)
                    ? article.image
                    : new URL(
                        article.image.replace(/^\/+/, ""),
                        document.baseURI
                    ).href;

                image.alt = article.title;
                image.loading = "lazy";
                image.className = "news-image";

                card.appendChild(image);
            }

            card.appendChild(
                createTextElement("h3", article.title)
            );

            if (article.date) {
                card.appendChild(
                    createTextElement("p", article.date, "news-date")
                );
            }

            if (article.body) {
    card.appendChild(
        createRichTextElement(article.body, "news-body")
    );
}

            container.appendChild(card);
        });

    } catch (error) {
        console.error("CMS News:", error);
        container.textContent = "News is temporarily unavailable.";
    }
}

// Display partners
async function displayPartners() {
    const section = document.getElementById("partners");
    if (!section) return;

    const container = document.createElement("div");
    container.className = "cms-partner-list";

    section.appendChild(container);

    try {
        const partners = await loadCMSCollection("partners");

        if (partners.length === 0) {
            container.textContent = "No partners available.";
            return;
        }

        partners.forEach(partner => {
            if (!partner.name) return;

            const card = document.createElement("article");
            card.className = "partner-card";

            const heading = document.createElement("h3");

            if (partner.website) {
                const link = document.createElement("a");

                const website = /^https?:\/\//i.test(partner.website)
                    ? partner.website
                    : `https://${partner.website}`;

                link.href = website;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = partner.name;

                heading.appendChild(link);
            } else {
                heading.textContent = partner.name;
            }

            card.appendChild(heading);

            if (partner.website) {
                const link = document.createElement("a");
                link.href = /^https?:\/\//i.test(partner.website)
                    ? partner.website
                    : `https://${partner.website}`;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Visit Our Website";

                card.appendChild(
                    createTextElement("p", "")
                );
                card.appendChild(link);
            }

            if (partner.phone) {
                const phone = document.createElement("p");
                const link = document.createElement("a");

                link.href = `tel:${partner.phone.replace(/[^\d+]/g, "")}`;
                link.textContent = partner.phone;

                phone.append("Phone: ", link);
                card.appendChild(phone);
            }

            if (partner.description) {
                card.appendChild(
                    createTextElement("p", partner.description)
                );
            }

            container.appendChild(card);
        });

    } catch (error) {
        console.error("CMS Partners:", error);
        container.textContent = "Partners are temporarily unavailable.";
    }
}

// Load all CMS sections
async function initialiseJustFMCMS() {
    await Promise.all([
        displayProgrammes(),
        displayNews(),
        displayPartners()
    ]);
}

initialiseJustFMCMS();
