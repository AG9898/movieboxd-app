# API

## GET /api/catalog/search

Request:
```http
GET /api/catalog/search?q=the%20bear&type=tv&page=1
```

Response:
```json
{
  "ok": true,
  "data": {
    "results": [
      {
        "source": "tmdb",
        "mediaType": "tv",
        "externalId": 123,
        "title": "The Bear",
        "year": 2022,
        "overview": "A young chef returns to Chicago...",
        "posterUrl": "https://image.tmdb.org/t/p/w500/abc.jpg",
        "backdropUrl": "https://image.tmdb.org/t/p/w780/def.jpg"
      }
    ]
  }
}
```

## POST /api/catalog/hydrate
Admin-only when `PUBLIC_READONLY=true` (requires `x-admin-passphrase` header).

Request:
```http
POST /api/catalog/hydrate
Content-Type: application/json
X-Admin-Passphrase: <ADMIN_PASSPHRASE>

{
  "source": "tmdb",
  "externalId": 123,
  "mediaType": "tv"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "id": "6fdbb5db-2bb2-48c8-babb-9b4ad4c7b722",
    "tmdbId": 123,
    "mediaType": "tv",
    "title": "The Bear",
    "originalTitle": "The Bear",
    "releaseDate": "2022-06-23T00:00:00.000Z",
    "posterPath": "/abc.jpg",
    "backdropPath": "/def.jpg",
    "overview": "A young chef returns to Chicago...",
    "runtimeMinutes": 30,
    "genres": ["Comedy", "Drama"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## GET /api/titles

Request:
```http
GET /api/titles?q=matrix
```

Response:
```json
{
  "ok": true,
  "data": [
    {
      "id": "6fdbb5db-2bb2-48c8-babb-9b4ad4c7b722",
      "tmdbId": 603,
      "mediaType": "movie",
      "title": "The Matrix",
      "originalTitle": "The Matrix",
      "releaseDate": "1999-03-31T00:00:00.000Z",
      "posterPath": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      "backdropPath": "/icmmSD4vTTDKOq2vvdulafOGw93.jpg",
      "overview": "A computer hacker learns...",
      "runtimeMinutes": 136,
      "genres": ["Action", "Sci-Fi"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## POST /api/diary/log

## POST /api/reviews

## GET /api/lists

## POST /api/lists

## PUT /api/lists/{listId}

## POST /api/lists/{listId}/items

## PUT /api/lists/{listId}/items
