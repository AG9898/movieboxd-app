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

Request:
```http
POST /api/catalog/hydrate
Content-Type: application/json

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
    "title": {
      "source": "tmdb",
      "mediaType": "tv",
      "externalId": 123,
      "title": "The Bear",
      "year": 2022,
      "overview": "A young chef returns to Chicago...",
      "posterUrl": "https://image.tmdb.org/t/p/w500/abc.jpg",
      "backdropUrl": "https://image.tmdb.org/t/p/w780/def.jpg",
      "releaseDate": "2022-06-23",
      "runtimeMinutes": 30,
      "genres": ["Comedy", "Drama"]
    }
  }
}
```

## POST /api/diary/log

## POST /api/reviews

## GET /api/lists

## POST /api/lists

## PUT /api/lists/{listId}

## POST /api/lists/{listId}/items

## PUT /api/lists/{listId}/items
