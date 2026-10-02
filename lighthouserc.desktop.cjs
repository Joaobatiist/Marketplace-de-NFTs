/** perfil desktop (preset desktop do Lighthouse) */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'localhost:4173',
      url: ['http://localhost:4173/', 'http://localhost:4173/nfts/nft_001'],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['warn', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse/desktop' },
  },
}
