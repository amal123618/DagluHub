describe('Core Learner Upskilling Flow', () => {
  beforeEach(() => {
    // Clear tokens and local state
    cy.clearLocalStorage();
    
    // Seed and intercept auth for consistent run
    cy.intercept('POST', '/api/auth/login/').as('loginReq');
    cy.intercept('GET', '/api/learning-paths/').as('getPaths');
    cy.intercept('POST', '/api/lessons/*/track-progress/').as('trackProgress');
  });

  it('should allow user registration, login, filtering, and dynamic video progress tracking', () => {
    // Visit home page
    cy.visit('/');
    
    // 1. Register/Login Step
    // Click login button trigger to launch auth modal
    cy.get('[data-testid="login-trigger"]').click();
    cy.get('input[name="username"]').type('learner_qa');
    cy.get('input[name="password"]').type('securepassword123');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@loginReq').its('response.statusCode').should('eq', 200);
    
    // Ensure token is stored in localStorage
    cy.should(() => {
      expect(localStorage.getItem('dagluhub_token')).to.exist;
    });

    // 2. Discover & Filter Courses
    cy.visit('/');
    cy.wait('@getPaths');
    
    // Click category filter chips
    cy.get('[data-testid="tag-filter-AI"]').click();
    
    // Assert cards change to reflect filter
    cy.get('[data-testid="course-card"]')
      .should('have.length.at_least', 1)
      .first()
      .within(() => {
        cy.get('[data-testid="course-title"]').should('contain', 'Prompt Engineering');
        cy.get('[data-testid="enroll-btn"]').click();
      });

    // 3. Lesson Detail & Video Tracking
    // Navigate to Lesson Detail page
    cy.get('[data-testid="start-lesson-1"]').click();
    cy.url().should('include', '/lessons/');

    // Assert progress bar starts at 0%
    cy.get('[data-testid="top-progress-bar"]')
      .should('have.attr', 'style')
      .and('contain', 'width: 0%');

    // Simulate watching a 5-minute video stream
    // We stub the video player events on timeupdate to propagate 275s out of 300s
    cy.get('video')
      .then(($video) => {
        const videoEl = $video[0];
        // Inject custom time update triggers
        Object.defineProperty(videoEl, 'currentTime', { value: 275, writable: true });
        Object.defineProperty(videoEl, 'duration', { value: 300, writable: true });
      });
      
    // Trigger progress track event (matches 90%+ milestone logic)
    cy.get('video').trigger('timeupdate');
    
    // Verify progress tracking API hook gets fired
    cy.wait('@trackProgress').its('response.statusCode').should('eq', 200);

    // Verify top progress tracker bar updates dynamically to a completion tier
    cy.get('[data-testid="top-progress-bar"]')
      .should('have.attr', 'style')
      .and('match', /width:\s*(90|100)%/);
  });
});
