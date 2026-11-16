// THE JUST FM 98.9 - CENTRAL CMS CONNECTION

const CMS_CONFIG = {
    owner: "thejustfm26",
    repository: "thejustfm-website",
    branch: "full-cms-integration"
};

// Build the GitHub API address for each CMS collection
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

    return files.filter(file =>
        file.name.endsWith(".md")
    );
}
// Read the contents of a CMS file
async function readCMSFile(file) {
    const response = await fetch(file.download_url);

    if (!response.ok) {
        throw new Error(`Unable to read file: ${file.name}`);
    }

    const content = await response.text();

    return {
        filename: file.name,
        content: content
    };
}
// Separate CMS metadata from article content
function parseCMSContent(rawContent) {
    const match = rawContent.match(
        /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/
    );

    if (!match) {
        throw new Error("Invalid CMS content format.");
    }

    const metadata = match[1];
    const body = match[2].trim();

    return {
        metadata: metadata,
        body: body
    };
}
// Extract individual fields from YAML metadata
// Parse YAML metadata using js-yaml
function parseCMSMetadata(metadata) {
    return jsyaml.load(metadata) || {};
}
// Load and process an entire CMS collection
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
                console.error(
                    "CMS file error:",
                    file.name,
                    error
                );

                return null;
            }
        })
    );

    return records.filter(record => record !== null);
}
