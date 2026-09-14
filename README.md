# Ivy Homes assignment

This repository contains my solution for the Ivy Homes assignment. It has two parts:

- `analysis/` contains the API client, probing scripts, and data analysis used
  to investigate the API and calculate the answers in `submission.json`.
- `frontend/` contains the SvelteKit application built on top of the live API.

## Running the frontend

The frontend requires Node.js and pnpm:

```bash
cd frontend
pnpm install
cp .env.example .env
```

Set the real API key in `frontend/.env`:

```env
API_BASE_URL=https://solve.ivy.homes
API_KEY=IVY26-your-key
```

Start the development server:

```bash
pnpm dev
```

The app is available at `http://localhost:5173`.

The frontend uses SvelteKit with the Cloudflare adapter and Tailwind CSS. Since I have enabled SSR, the API key is only read by server-side code. Access and refresh tokens are stored in HTTP-only cookies rather than browser storage.

## What I found in the API

### Authentication

The documented API-key flow did not work as written. The documentation showed
the key as a query parameter, but the live API requires:

```http
X-API-Key: IVY26-...
```

Login returns a short-lived access token, a refresh token, a refresh URL, and
`expires_in: 900`. I implemented refresh handling so the session can continue
after the 15-minute access-token lifetime. Logout returns success but does not
revoke stateless tokens, so the application clears its local cookies and
discards the tokens.

### Pagination

The documentation describes `page` pagination and a maximum `limit` of 200.
The live API uses `offset` and `limit`, caps the effective limit at 50, and
returns `has_more` along with the results.

The reported `total` is not reliable for complete traversal. In the unfiltered
dataset it reported lower values than the number of records that could
actually be retrieved. I therefore advance the offset by the number of records
returned and continue while `has_more` is true.

### Endpoint differences

Several documented routes were missing or had different live equivalents:

- Listing detail is served at `/v1/listings/{listing_id}`, not the documented
  singular `/v1/listing/{listing_id}`.
- The documented similar-listings endpoint returns 404.
- Saved listings use `/v1/saved` and `/v1/saved/{listing_id}`, not
  `/v1/favourites`.
- `/v1/analytics/summary` returns 404. The insights screen computes the
  documented aggregates locally from the full collections.

### Filters

Some query parameters are accepted but silently ignored by the API, including
furnishing and minimum/maximum price on listings. The browse endpoints therefore
split filters into two groups: verified upstream filters are forwarded, while
unsupported filters are evaluated by the SvelteKit server.

The browser starts with the first upstream page and incrementally scans more
pages only when it needs additional records to fill the requested result
offset. The browser receives only the requested page. This keeps the initial
request small while still allowing filters such as price ranges to work beyond
the first 50 upstream records. The market-insights endpoint is separate because
its aggregate cards genuinely require complete collections.

This incremental strategy is deliberately request-scoped: when an unsupported
filter is applied, the server scans from the beginning until it has enough
matching records for the requested page or the upstream collection is
exhausted. It does not claim that an arbitrary ignored filter can be globally
ordered without scanning the entire source; that would require an upstream
filter or a persistent indexed copy of the data.

### Sorting

Sorting works for all three endpoints but with one issue. Since units are mixed for `carpet_area`s in listings and for `price_min` and `price_max` in projects, the returned response makes it looks like the sorting is broken. For example, a project with `price_min == 99.8` comes before a project with `price_min == 1.01`. This looks absurd at first but when we realise that the intended unit for `1.01` value is crores and not lakhs, it becomes clear why it comes after.

## Data corrections

### Listing areas

The documentation says that listing areas are always square feet. I found a
subset of `magichomes` listings whose `carpet_area` and
`super_built_up_area` values are in square metres. These records are much
smaller than the normal square-foot range for the same bedroom and property
type, and multiplying them by `10.7639` restores the expected scale.

The correction is applied before displaying areas, calculating price per square
foot, identifying duplicate properties, and sorting listings locally.

### Project prices

Project `price_min` and `price_max` are not stored as rupees despite the
documentation saying so. Each field is independently encoded:

- raw values below `10` represent crores;
- raw values of `10` or more represent lakhs.

I convert each field independently to rupees. This removes impossible
`price_min > price_max` combinations and is also consistent with the live
API's own observed sort behavior.

### Duplicate properties

Listing IDs are unique, but listing IDs do not always represent unique physical
properties. I grouped records using stable property attributes such as
`apartment_name`, `locality`, `property_type`, `bedroom`/`bathroom` count, `floor`,
`furnishing`, `parking`, and `balcony` count. I then compared corrected carpet areas
and nearby coordinates. Price was deliberately not used as an identity field
because duplicate records can have different asking prices.

### Corrupt records

I treated records as corrupt when they described impossible data,
for example:

- non-positive prices,
- a floor above the reported total floors,
- zero bedrooms for a non-plot property,
- carpet area greater than super built-up area,
- coordinates outside the expected city region.

These checks are kept separate from the square-metre correction. A small area
caused by a unit mismatch is not automatically treated as a corrupt listing.

### Fake listings

I used a simple hypothesis for the answer: listings priced below ₹100,000 are likely enquiry-generation records rather than genuine sale inventory. Some listings are selling for less than the monthly rents for some other properties, they are obviously fake.

## Hypotheses that did not pan out

These were some of the hypotheses I tested and rejected:

### Every repeated coordinate is a duplicate property

At first, repeated latitude/longitude pairs looked like a straightforward way
to count duplicate properties. That was too aggressive. Multiple legitimate
listings can share a building or project coordinate, and some listings from
the same source use the same approximate location. I only used coordinates as
one part of duplicate clustering, together with the property name, locality,
structural attributes, corrected area, and a small coordinate distance.

### A matching apartment name and locality is enough to identify a duplicate

This also produced false positives. Apartment names are reused across units,
projects, and independently created listings. I rejected name-plus-locality as
a complete identity rule and required additional matching attributes such as
bedrooms, bathrooms, floor, furnishing, parking, balcony count, area, and
nearby coordinates.

### Price should be used to identify duplicate properties

Matching records sometimes had substantially different asking prices while
still describing the same physical property. Price appears to reflect noisy
or independently sourced listing information, so using it in the identity
key split genuine duplicate clusters apart. I deliberately excluded price
from the duplicate-matching rule.

### Every unusually small listing area is corrupt

The small `magichomes` areas were initially suspicious, but the pattern was
consistent with a unit conversion rather than impossible data. Their
super-built-up to carpet-area ratios matched the rest of the dataset, and
converting square metres to square feet placed them in the expected range.
They were therefore corrected as unit errors instead of being included in the
corrupt-listing answer.

### Every low-priced listing is fake

A low price alone is not enough to prove that a listing is fraudulent. I
tested other signals, including repeated coordinates, impossible property
values, and duplicate relationships. Those signals did not identify one
clean, reliable fraud rule. I therefore used the narrower positive-price
below-₹100,000 hypothesis for the submitted fake-listing candidates and
described it as a conservative hypothesis rather than an API-provided fact.

## What I would do with two more days

With two additional days I would:

1. verify my conclusions against more records in the downloaded dataset.
2. try to find more possible ways of getting the server filter on max_price, min_price and furnishing. Any client-side filter either excludes valid records or needs the entire dataset.
3. try to come up with more ways that the data could go wrong.

## Use of AI

I used an gpt-5.6-luna as a research and development assistant. It helped me generate
probe ideas and scaffold the frontend. I did not treat
generated conclusions as evidence. I checked API behavior, calculations, hypotheses,
and findings manually against the responses and downloaded records.
