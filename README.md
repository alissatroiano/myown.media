# myown.media 🌌

## Inspiration

I’m an artist and I love creating. I also love the immersive, visceral feeling of walking through a physical gallery. However, most of the digital portfolio builders out there are either too simple, too expensive, or too technical to use. I wanted to create something that would bridge that gap—a platform that would allow artists to create beautiful, interactive 3D galleries without any coding knowledge.

Most creative portfolios require expensive CMS subscriptions, complex hosting, or technical expertise to develop. For emerging artists—whether they are in graffiti, fashion, fine art, or photography—having a premium, interactive web presence is critical, but often financially and technically out of reach.

**myown.media** solves this by providing a zero-cost, zero-code, fully interactive 3D gallery. Hosted on **Google AI Studio**, any artist can instantly spin up, design, customize, and publish a premium 3D exhibition. By compressing the entire portfolio state into a single shareable URL hash, artists can distribute their exhibitions across the web without paying a cent for databases or server hosting.

## What it does

**myown.media** is a web application that allows artists to create beautiful, interactive 3D galleries without any coding knowledge. It features a scroll-driven 3D cube that rotates and translates as visitors scroll, a customization drawer that allows creators to personalize their branding, adjust grid lines, turn on/off glowing active matrices, select typography pairs, and customize primary accent colors in real-time, and a no-code face editor that allows artists to customize each face of the 3D cube with titles, taglines, descriptive body text, custom artwork URLs, and custom metrics (e.g., Year, Medium, Resolution, Contrast).

### 🚀 Key Features

*   **Scroll-Driven 3D Exhibition Cube**: An immersive, high-performance 3D canvas that rotates and translates as visitors scroll. It acts like a physical gallery, guiding visitors facet-by-facet through a curated sequence of works.
*   **The Creator Studio**: A customization drawer allowing creators to personalize branding, adjust grid lines, turn on/off glowing active matrices, select typography pairs, and customize primary accent colors in real-time.
*   **No-Code Face Editor**: Artists can customize each face of the 3D cube with titles, taglines, descriptive body text, custom artwork URLs, and custom metrics (e.g., Year, Medium, Resolution, Contrast).
*   **Instant Share & Remix (Serverless URL State)**: Generate a shareable link that encodes the entire portfolio setup in a compressed Base64 string in the URL hash. Visitors can view the portfolio in guest mode and clone it straight to their local browser workspace in one click.
*   **Local Portfolio Database**: Save, load, and delete multiple exhibition drafts directly inside the browser's `localStorage` workspace.

## How I built it

I built **myown.media** using **React 19**, **TypeScript**, and **Vite**. The application features a scroll-driven 3D cube that rotates and translates as visitors scroll, a customization drawer that allows creators to personalize their branding, adjust grid lines, turn on/off glowing active matrices, select typography pairs, and customize primary accent colors in real-time, and a no-code face editor that allows artists to customize each face of the 3D cube with titles, taglines, descriptive body text, custom artwork URLs, and custom metrics (e.g., Year, Medium, Resolution, Contrast). I also added a share and clone feature that allows artists to share their galleries with others and a local database that allows artists to save, load, and delete multiple exhibition drafts directly inside the browser's `localStorage` workspace.

To expedite the develpment process, myown.media was prototyped in Google AI Studio, utilizing Gemini 3 Pro to generate the initial React components and styling. This rapid prototyping approach allowed me to iterate quickly on ideas and features, and to test them in a live environment.

### 🛠️ Tech Stack & Architecture

*   **Frontend Core**: React 19, TypeScript, and Vite.
*   **Styling & UI**: Tailwind CSS for premium layouts, Lucide React for modern iconography, and CSS variables for real-time theme mapping.
*   **Graphics**: 3D CSS transforms optimized for fluid 60 FPS performance via direct DOM manipulation during scroll events.
*   **Hosting Compatibility**: Designed to run seamlessly in the **Google AI Studio** runtime environment, featuring auto-injected secrets and HMR control for hot-reload sandboxes.

## Challenges I ran into

### 🔄 State Compression & URL Limits
Encoding complete custom gallery configurations (containing up to 6+ slides, titles, descriptions, custom tags, custom statistics, and images) into a single URL was a major challenge. Standard URLs have a length limit (around 2,000 characters in some browsers). To address this, we optimized the JSON schema by using abbreviated keys (e.g., `n` for `name`, `fc` for `faces`, `st` for `stats`) and compressed the payload using URI-escaped Base64 encoding.

### 💾 LocalStorage Quota Management
Allowing users to upload their own images led to quick `localStorage` exhaustion (5MB quota limit). We solved this by building a client-side image compression pipeline inside [CreatorStudio.tsx](file:///c:/Users/alissa/Desktop/GitHub/myown.media/src/components/CreatorStudio.tsx) using HTML5 Canvas. The app automatically resizes uploaded artwork to a maximum of 550x550 pixels and compresses it to a lightweight JPEG (0.8 quality) in real-time before saving.

## Accomplishments that I'm proud of

*   **Zero-Cost, Zero-Database Architecture**: Successfully built a fully customizable website creator that costs $0 to host and run, requiring no backend servers or databases.
*   **Fluid 3D CSS Transform Engine**: Accomplished smooth, scroll-driven 3D layout transformations directly mapping visitor scrolls to matrix coordinates, maintaining a constant 60 FPS without heavy WebGL overhead.
*   **Instant Remixing**: Created a friction-free guest mode that allows visitors to view shared exhibitions and clone them straight into their own browser with one click.

## What I learned

*   **Client-Side Asset Processing**: Learned how to manipulate canvas blobs and base64 strings to build robust file-processing utilities in React.
*   **Performance Optimization**: Gained deep knowledge of CSS 3D transforms, perspective styling, hardware acceleration (`translate3d`), and active render queues.
*   **State Serialization**: Explored how to cleanly serialize and inflate complex application states using URI components and Base64 string structures.

## What's next for myown.media

*   **Production Hosting**: Deploying the frontend to Vercel/Netlify to support custom subdomains (`username.myown.media`).
*   **NoSQL Server Integration**: Transitioning to a NoSQL database (such as MongoDB or Google Firestore) for persistent, shorter URLs, analytics, and user registration.
*   **Audio Galleries**: Adding spatial audio guides so artists can narrate their work as viewers scroll past each face of the exhibition cube.

---

## 🏆 Judging Criteria Answers

### 📈 Progress: How much progress did you make?
We built a **fully functional, production-ready MVP** from scratch. 
*   **Interactive 3D Stage**: An immersive, scroll-driven 3D exhibition cube that guides viewers facet-by-facet.
*   **Creator Studio**: A complete custom design drawer supporting real-time theme swapping (light/dark), accent color matching, and typography pairing.
*   **No-Code Page Editor**: Form editor supporting custom titles, tags, descriptive text blocks, and structured metadata tables for all 6 faces of the cube.
*   **URL-Based Sharing & Cloning**: Fully functional Base64 compression engine that serializes the entire exhibition state into a URL hash, enabling serverless guest previews and instant layout "remixing."
*   **Local Exhibition Workspace**: A local database in `localStorage` supporting draft creation, renaming, loading, and deletion.

### 💡 Concept: Does it solve a real problem?
**Yes.** Most digital portfolio builders (Squarespace, Cargo, Readymag) are expensive, rigid, or highly technical. Emergent artists (fine art, photography, street art, fashion designers) often lack the funds or coding expertise to build a unique web showcase. 
**myown.media** democratizes interactive art exhibitions:
1.  **Immersive Representation**: The scroll-driven 3D cube mimics a physical gallery space, presenting work in a curated, tactile sequence rather than a flat scroll list.
2.  **Zero Barriers to Entry**: No user registration, no coding, and no hosting fees.
3.  **Decentralized Sharing**: Portfolios are stored in the URL itself. Artists have total ownership of their data without depending on centralized servers.

### 🚀 Feasibility: Could this become a startup or company?
**Yes.** The project is built on a highly scalable, low-overhead model that is perfect for a SaaS business.
1.  **Low Operating Overhead**: The initial serverless architecture (Vite + Netlify + Local URL compression) means the cost to acquire and host the first 100,000 users is virtually $0.
2.  **Scalable Tech Stack**: 
    *   **Hosting**: The app will be deployed to a static edge network (**Netlify/Vercel**) for fast global delivery and automatic custom domain mapping.
    *   **NoSQL Database Backend**: Post-judging, we will connect a serverless NoSQL database (e.g., MongoDB, Supabase, or Firestore) to store user accounts, persist heavy media assets (integrated with cloud storage CDN buckets), track visitor analytics, and offer custom domains.
3.  **Monetization Roadmap**:
    *   *Free Tier*: URL-hash-based hosting, standard templates, local draft saving.
    *   *Pro Tier ($8/month)*: Short URL redirect mapping, custom domain support (`yourname.myown.media` or `customdomain.com`), custom font uploads, and detailed visitor analytics.
    *   *Gallery Tier ($29/month)*: Collaborative curation, multi-room exhibitions, and integrated web3/NFT wallets or purchase checkout links.

---

## 💻 Local Setup & Development

Follow these steps to run the workspace on your local machine:

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory and add your Gemini API Key if you wish to leverage server-side features:

```env
GEMINI_API_KEY="your_api_key_here"
```

> *Note: Google AI Studio automatically injects `GEMINI_API_KEY` and `APP_URL` at runtime. Refer to [.env.example](.env.example) for details.*

### 3. Run Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`.

---

## 🌌 How to Create and Share Your Gallery

1.  **Open the Studio Panel**: Click the **Studio Panel** gear button at the top-left of the screen to open the customization drawer.
2.  **Customize Branding & Presets**: Choose a preset template, adjust the background theme (dark/light), pick an accent color, and change the font pairing.
3.  **Edit the Art Facets**: Go through each face of the cube. Upload your own artwork via image URLs, set custom titles, specify metrics, and write descriptions.
4.  **Save to Workspace**: Give your portfolio a custom name and save it to your local database.
5.  **Generate Share Link**: Click the **Share** button in the Studio Panel to copy a compressed URL. Send this link to anyone to show off your gallery. They can click **Clone & Edit** to use your layout as a starter template!
