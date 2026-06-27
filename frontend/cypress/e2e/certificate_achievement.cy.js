describe('Certificate Achievement & Verification Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    // Seed token to bypass manual login
    localStorage.setItem('dagluhub_token', 'mock_qa_token_string_12345');
    
    // Intercept API calls
    cy.intercept('GET', '/api/auth/me/', {
      id: 3,
      username: 'learner_qa',
      email: 'learner@dagluhub.edu',
      role: 'learner'
    }).as('getMe');
    
    cy.intercept('POST', '/api/quizzes/*/submit/', {
      score: "100%",
      passed: true,
      results: [{ question_id: 1, is_correct: true, correct_option_id: 2, explanation: "Correct" }]
    }).as('submitQuiz');

    cy.intercept('POST', '/api/learning-paths/*/claim-certificate/', {
      statusCode: 201,
      body: {
        id: 9,
        certificate_uuid: "e4db8990-252a-4632-9cb7-63d1ff394551",
        learning_path: 1,
        learning_path_title: "AI Tools & Automation",
        issued_at: new Date().toISOString()
      }
    }).as('claimCert');

    cy.intercept('GET', '/api/certificates/', [
      {
        id: 9,
        certificate_uuid: "e4db8990-252a-4632-9cb7-63d1ff394551",
        learning_path: 1,
        learning_path_title: "AI Tools & Automation",
        issued_at: new Date().toISOString()
      }
    ]).as('getCertificates');
  });

  it('should issue certificate on final quiz completion and support UUID sharing copy-to-clipboard', () => {
    // Visit lesson quiz page
    cy.visit('/lessons/1/quiz');
    cy.wait('@getMe');

    // Answer questions
    cy.get('[data-testid="option-btn"]').first().click();
    cy.get('[data-testid="submit-quiz-btn"]').click();
    cy.wait('@submitQuiz');

    // Assert completion modal pops up automatically celebrating completion
    cy.get('[data-testid="completion-modal"]').should('be.visible');
    cy.get('[data-testid="modal-title"]').should('contain', 'Congratulations!');
    
    // Click claim button in modal
    cy.get('[data-testid="claim-cert-modal-btn"]').click();
    cy.wait('@claimCert');

    // Navigate to profile dashboard
    cy.get('[data-testid="sidebar-profile-link"]').click();
    cy.url().should('include', '/dashboard');
    cy.wait('@getCertificates');

    // Validate digital certificate card has materialized on the dashboard
    cy.get('[data-testid="certificate-card"]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-testid="cert-title"]').should('contain', 'AI Tools & Automation');
        
        // Assert download triggers clipboard link copy with cryptographically unique UUID
        cy.get('[data-testid="download-cert-btn"]').click();
      });

    // Check Clipboard content matches the certificate uuid verification URL
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.contain('e4db8990-252a-4632-9cb7-63d1ff394551');
      });
    });
  });
});
