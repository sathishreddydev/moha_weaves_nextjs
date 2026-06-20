export default function OrganizationSchema() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": `${baseUrl}/#organization`,
        name: "Urumi by Mounika",
        alternateName: ["Urumi", "Urumi Fashion", "Urumi Clothing", "urumibymounika"],
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo.png`,
          width: 512,
          height: 512,
        },
        description: "Urumi by Mounika is India's trusted online store for complete women's clothing – sarees, lehengas, kurtis, salwar suits, dupattas, blouses, indo-western wear, western wear, baby frocks, and men's designer outfits.",
        foundingDate: "2020",
        founder: {
          "@type": "Person",
          name: "Mounika",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hyderabad",
          addressRegion: "Telangana",
          postalCode: "500001",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "17.3850",
          longitude: "78.4867",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-74984-76544",
          contactType: "customer service",
          email: "care@urumibymounika.com",
          availableLanguage: ["English", "Hindi", "Telugu"],
          areaServed: "IN",
        },
        sameAs: [
          "https://www.instagram.com/urumifashion/",
        ],
        priceRange: "₹₹",
        paymentAccepted: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Razorpay"],
        currenciesAccepted: "INR",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Urumi Women's, Kids & Men's Fashion Collection",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "Sarees",
            },
            {
              "@type": "OfferCatalog",
              name: "Lehengas",
            },
            {
              "@type": "OfferCatalog",
              name: "Kurtis & Short Kurtis",
            },
            {
              "@type": "OfferCatalog",
              name: "Salwar Suits - Churidar, Anarkali, Palazzo",
            },
            {
              "@type": "OfferCatalog",
              name: "Dupattas",
            },
            {
              "@type": "OfferCatalog",
              name: "Blouses",
            },
            {
              "@type": "OfferCatalog",
              name: "Indo-Western Wear - Fusion Gowns, Cape Dresses, Co-ord Sets",
            },
            {
              "@type": "OfferCatalog",
              name: "Western Wear - Dresses, Tops, Jeans, Skirts, Jumpsuits",
            },
            {
              "@type": "OfferCatalog",
              name: "Baby Frocks",
            },
            {
              "@type": "OfferCatalog",
              name: "Men's Designer Outfits",
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Urumi by Mounika",
        alternateName: "Urumi",
        description: "Shop complete women's clothing – sarees, lehengas, kurtis, salwar suits, indo-western, western wear, baby frocks & men's designer outfits at Urumi by Mounika",
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
        inLanguage: "en-IN",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/collections?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/#webpage`,
        url: baseUrl,
        name: "Urumi by Mounika - Women's Clothing, Sarees, Lehengas, Kurtis, Baby Frocks & Men's Outfits Online",
        description: "Shop all women's clothing at Urumi by Mounika – sarees, lehengas, kurtis, salwar suits, dupattas, blouses, indo-western, western wear, baby frocks & men's designer outfits. Free shipping across India.",
        isPartOf: {
          "@id": `${baseUrl}/#website`,
        },
        about: {
          "@id": `${baseUrl}/#organization`,
        },
        inLanguage: "en-IN",
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
