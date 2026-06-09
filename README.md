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

### Sharing and Cloing 

While it was easy to share gallery settings into a compressed url, it was difficult to retrieve the gallery settings from the url. 

## Accomplishments that I'm proud of

I was able to create a beautiful, interactive 3D gallery that is easy to use and customize. It is also free to use and does not require any coding knowledge. 

## What I learned


## What's next for myown.media

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
