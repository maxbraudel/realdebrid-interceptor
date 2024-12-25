# RealDebrid Interceptor

A Chrome extension that automatically debrids and downloads hoster or torrent links via your RealDebrid account upon clicking.

## What is RealDebrid?

[RealDebrid](https://real-debrid.com/) is a platform that makes downloading both torrent and centralized files so much easier. It eliminates the need for multiple premium subscriptions to sites like 1fichier or DuckDuckGo, offering unlimited downloads at speeds up to 1000 GB/s. Ideal for private torrent downloads or when facing a lack of seeders, RealDebrid also caches torrent files. If another user has requested a file within the last two weeks, it can be downloaded directly from RealDebrid’s servers at maximum speed.

## Features

- Supports hoster links : [RealDebrid hosters list](https://real-debrid.com/compare)
- Supports torrent links (e.g., magnet links)
- Supports multiple RealDebrid accounts
- Display a progress bar for uncached torrents that are being downloaded

## Installation

1. Download the latest release from the [releases page](https://github.com/maxbraudel/real-debrid-interceptor/releases).
2. Extract the downloaded file to your desired location.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable the "Developer mode" toggle in the top right corner.
5. Click on "Load unpacked" and select the extracted folder.

## Usage

1. Open the RealDebrid Interceptor popup by clicking on the extension icon in the top right corner of your browser.
2. Enter your RealDebrid API key.
3. Click "Save" to save your API key.
4. Open a hoster or torrent link, it will be debrid and downloaded automatically.

## To do

- Improve toast notifications

## License

This project is licensed under the MIT License