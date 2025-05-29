# PTCL Clinical Trials Viewer

A web application to search, filter, and view clinical trials for Peripheral T-cell Lymphoma (PTCL) and its subtypes, using data from ClinicalTrials.gov.

## Features

- Search and filter by PTCL subtype and trial status
- Filter by location (ZIP code + radius in miles)
- "Load More" pagination
- View trial details and locations
- Direct link to each study on ClinicalTrials.gov

## Getting Started

### 1. Clone the repository
```sh
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
```

### 2. Install dependencies
```sh
npm install
cd server
npm install
cd ..
```

### 3. Start the backend
```sh
cd server
node index.js
```

### 4. Start the frontend
```sh
npm start
```

## Usage

- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Use the filters to search for clinical trials.
- Click "View on ClinicalTrials.gov" for more details.

## Tech Stack

- React + TypeScript (frontend)
- Node.js + Express (backend proxy)
- Material-UI (UI components)
- ClinicalTrials.gov v2 API

## License

MIT (or your preferred license)
