# Backend CAS Parser API Implementation Guide

This guide explains the backend endpoints needed for the CAS Parser integration.

## Required npm Packages

```bash
npm install google-auth-library axios form-data
```

## Environment Variables

Add to your backend `.env`:

```env
CAS_PARSER_API_KEY=GGv8vbBbzu9oD5AvlHKAH5CTl5XQ4tZF8Mj6Bfyq
CAS_PARSER_BASE_URL=https://portfolio-parser.api.casparser.in/v4
```

## API Endpoints to Create

### 1. POST `/api/user/update-profile`

Update user profile with PAN and email.

```typescript
router.post('/api/user/update-profile', authenticateJWT, async (req, res) => {
  try {
    const { pan, email } = req.body;
    const userId = req.user.userId; // From JWT

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      return res.status(400).json({ message: 'Invalid PAN format' });
    }

    // Update user in database
    await db.query(
      'UPDATE users SET pan = $1, email = $2 WHERE id = $3',
      [pan, email, userId]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});
```

### 2. POST `/api/cas/fetch`

Auto-fetch CAS from CAMS or KFintech.

```typescript
import axios from 'axios';

router.post('/api/cas/fetch', authenticateJWT, async (req, res) => {
  try {
    const { pan, email, registrar, fromDate, toDate } = req.body;
    const userId = req.user.userId;

    // Determine which API to call based on registrar
    const endpoint = registrar === 'cams'
      ? '/cams/generate'
      : '/kfintech/generate';

    // Request CAS from the parser service
    const response = await axios.post(
      `${process.env.CAS_PARSER_BASE_URL}${endpoint}`,
      {
        email,
        pan_no: pan,
        from_date: fromDate,
        to_date: toDate,
        password: pan // Default password is usually PAN
      },
      {
        headers: {
          'x-api-key': process.env.CAS_PARSER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse the CAS response
    const casData = response.data;

    // Store portfolio data in database
    await savePortfolioData(userId, casData);

    res.json({
      success: true,
      message: 'Portfolio fetched successfully',
      data: casData
    });

  } catch (error: any) {
    console.error('Fetch CAS error:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({
        message: 'No holdings found. Try a different registrar or upload CAS manually.'
      });
    }

    res.status(500).json({
      message: error.response?.data?.message || 'Failed to fetch CAS'
    });
  }
});
```

### 3. POST `/api/cas/upload`

Parse uploaded CAS PDF.

```typescript
import FormData from 'form-data';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/cas/upload',
  authenticateJWT,
  upload.single('pdf_file'),
  async (req, res) => {
    try {
      const { password, pan } = req.body;
      const userId = req.user.userId;
      const pdfFile = req.file;

      if (!pdfFile) {
        return res.status(400).json({ message: 'PDF file is required' });
      }

      // Create form data for CAS Parser API
      const formData = new FormData();
      formData.append('pdf_file', pdfFile.buffer, {
        filename: pdfFile.originalname,
        contentType: 'application/pdf'
      });
      formData.append('password', password);

      // Parse CAS using smart parse endpoint
      const response = await axios.post(
        `${process.env.CAS_PARSER_BASE_URL}/smart/parse`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'x-api-key': process.env.CAS_PARSER_API_KEY
          }
        }
      );

      const casData = response.data;

      // Store portfolio data in database
      await savePortfolioData(userId, casData);

      res.json({
        success: true,
        message: 'CAS parsed successfully',
        data: casData
      });

    } catch (error: any) {
      console.error('Upload CAS error:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        return res.status(401).json({
          message: 'Incorrect PDF password. Please try again.'
        });
      }

      res.status(500).json({
        message: error.response?.data?.message || 'Failed to parse CAS'
      });
    }
  }
);
```

### 4. Helper Function: Save Portfolio Data

```typescript
async function savePortfolioData(userId: string, casData: any) {
  try {
    // Extract mutual fund holdings
    const mutualFunds = casData.folios || [];

    // Clear existing portfolio data for user
    await db.query('DELETE FROM portfolio_holdings WHERE user_id = $1', [userId]);

    // Insert mutual fund holdings
    for (const folio of mutualFunds) {
      for (const scheme of folio.schemes || []) {
        await db.query(
          `INSERT INTO portfolio_holdings
           (user_id, folio_number, scheme_name, amc, units, nav, current_value,
            cost_value, gain_loss, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId,
            folio.folio,
            scheme.scheme,
            scheme.amc,
            scheme.balance_units,
            scheme.nav,
            scheme.valuation,
            scheme.cost,
            scheme.gain_loss,
            'mutual_fund'
          ]
        );
      }
    }

    // Extract equity holdings if available
    const equities = casData.equity_holdings || [];
    for (const equity of equities) {
      await db.query(
        `INSERT INTO portfolio_holdings
         (user_id, symbol, name, quantity, price, current_value, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          equity.symbol,
          equity.name,
          equity.quantity,
          equity.ltp,
          equity.value,
          'equity'
        ]
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Save portfolio error:', error);
    throw error;
  }
}
```

## Database Schema

Create these tables in your database:

```sql
-- Users table (add these columns if not exist)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS pan VARCHAR(10),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  folio_number VARCHAR(50),
  scheme_name VARCHAR(255),
  amc VARCHAR(100),
  symbol VARCHAR(20),
  name VARCHAR(255),
  units DECIMAL(15, 4),
  quantity INTEGER,
  nav DECIMAL(10, 4),
  price DECIMAL(10, 2),
  current_value DECIMAL(15, 2),
  cost_value DECIMAL(15, 2),
  gain_loss DECIMAL(15, 2),
  type VARCHAR(20) CHECK (type IN ('mutual_fund', 'equity')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_user ON portfolio_holdings(user_id);
CREATE INDEX idx_portfolio_type ON portfolio_holdings(type);
```

## CAS Parser API Response Format

The CAS Parser API returns data in this format:

```json
{
  "investor_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "pan": "ABCDE1234F"
  },
  "folios": [
    {
      "folio": "12345/67",
      "amc": "HDFC Mutual Fund",
      "schemes": [
        {
          "scheme": "HDFC Equity Fund - Direct Plan - Growth",
          "balance_units": 1000.5,
          "nav": 450.75,
          "valuation": 451000.38,
          "cost": 400000.00,
          "gain_loss": 51000.38
        }
      ]
    }
  ],
  "equity_holdings": [
    {
      "symbol": "RELIANCE",
      "name": "Reliance Industries Ltd",
      "quantity": 100,
      "ltp": 2500.50,
      "value": 250050
    }
  ]
}
```

## Testing

Test the endpoints:

### 1. Fetch CAS
```bash
curl http://localhost:2069/api/cas/fetch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pan": "ABCDE1234F",
    "email": "user@example.com",
    "registrar": "cams",
    "fromDate": "2024-01-01",
    "toDate": "2024-12-31"
  }'
```

### 2. Upload CAS
```bash
curl http://localhost:2069/api/cas/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pdf_file=@cas.pdf" \
  -F "password=ABCDE1234F" \
  -F "pan=ABCDE1234F"
```

## Error Handling

Common errors to handle:

1. **404 - No holdings found**: User has no mutual funds with this registrar
2. **401 - Invalid password**: Wrong PDF password
3. **400 - Invalid PAN**: PAN format incorrect
4. **500 - Parser service down**: CAS Parser API unavailable

## Next Steps

1. Implement these endpoints in your backend
2. Test with the CAS Parser sandbox environment first
3. Create the database tables
4. Update frontend to test the complete flow
5. Switch to production API key when ready
