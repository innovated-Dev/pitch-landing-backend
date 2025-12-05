import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: "https://tm-sooty-eight.vercel.app", 
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); 

app.use(express.json()); 


const BREVO_API_KEY = process.env.API_KEY;
const BREVO_LIST_ID = process.env.LIST_ID;
const TELEGRAM_GROUP = process.env.GROUP_LINK;
const PLATFORM_URL = process.env.URL;

if(!BREVO_API_KEY || !BREVO_LIST_ID || !TELEGRAM_GROUP || !PLATFORM_URL) {
  console.error("Missing required environment variables. Please check your .env file.");
  process.exit(1);
}


app.get('/', (req, res)=>{
  res.json({
    status: "Server is running",
    endpoints: {
      subscribe: 'POST /api/subscribe',
      health: 'GET /api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    brevoConfigured: !!BREVO_API_KEY,
    timeStamp: new Date().toISOString()
  });
})


app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, vipLevel } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email address' 
      });
    }

    console.log(`📧 Processing: ${email} (VIP ${vipLevel || 'Not Selected'})`);

    const addContactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: email.split('@')[0],
          VIP_LEVEL: vipLevel || 'Not Selected',
          SIGNUP_DATE: new Date().toISOString(),
          HAS_CONVERTED: false,
          TELEGRAM_LINK: TELEGRAM_GROUP,
          PLATFORM_LINK: PLATFORM_URL
        },
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true
      })
    });

    const contactData = await addContactResponse.json();

    if (addContactResponse.status === 201 || addContactResponse.status === 204) {

      const sendEmailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'Astra at Token Markets',
            email: 'noreply@markets.mojibola.com.ng' 
          },
          to: [
            {
              email: email,
              name: email.split('@')[0]
            },
          ],
          replyTo: {
            email: 'klrrdgw@gmail.com',
            name: 'Token Markets Support'
          },
          subject: '🚀 Welcome to Token Markets - Get Started Now!',
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); padding: 40px; text-align: center; }
                    .header h1 { margin: 0; color: white; font-size: 32px; font-weight: bold; }
                    .content { padding: 40px; }
                    .content h2 { margin: 0 0 16px 0; color: #1e40af; font-size: 24px; }
                    .content p { margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6; }
                    .highlight-box { background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #0891b2; padding: 24px; margin: 24px 0; }
                    .highlight-box h3 { margin: 0 0 16px 0; color: #1e40af; font-size: 18px; }
                    .highlight-box ol { margin: 0; padding-left: 20px; color: #334155; line-height: 1.8; }
                    .vip-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; }
                    .vip-box p { margin: 0; color: #78350f; font-size: 16px; font-weight: 600; }
                    .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px; }
                    .benefits { margin: 32px 0 16px 0; }
                    .benefits div { padding: 8px 0; color: #334155; font-size: 15px; }
                    .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer p { margin: 0 0 8px 0; color: #64748b; font-size: 14px; }
                    @media only screen and (max-width: 600px) {
                        .container { border-radius: 0 !important; margin: 0 !important; }
                        .content, .header { padding: 24px !important; }
                        .header h1 { font-size: 24px !important; }
                        .button { display: block !important; margin: 8px 0 !important; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Welcome to Token Markets!</h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                            Your journey to smarter trading starts now
                        </p>
                    </div>
                    
                    <div class="content">
                        <h2>Hello ${email.split('@')[0]}! 👋</h2>
                        
                        <p>Thank you for joining Token Markets! You're now part of a community that's redefining digital wealth building.</p>
                        
                        <div class="highlight-box">
                            <h3>🎯 Your Next Steps:</h3>
                            <ol>
                                <li>Join our exclusive Telegram community</li>
                                <li>Visit our trading platform</li>
                                <li>Choose your VIP tier to unlock trading</li>
                            </ol>
                        </div>
                        
                        ${vipLevel && vipLevel !== 'Not Selected' ? `
                        <div class="vip-box">
                            <p>⭐ You showed interest in <strong>VIP Level ${vipLevel}</strong>!</p>
                            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px; font-weight: normal;">
                                Our team will contact you shortly with exclusive details and benefits.
                            </p>
                        </div>
                        ` : ''}
                        
                        <p style="text-align: center; margin: 32px 0;">
                            <a href="${TELEGRAM_GROUP}" class="button">📱 Join Telegram Community</a>
                            <a href="${PLATFORM_URL}" class="button" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">🚀 Launch Platform</a>
                        </p>
                        
                        <h3 style="margin: 32px 0 16px 0; color: #1e40af; font-size: 20px;">Why Token Markets?</h3>
                        <div class="benefits">
                            <div>✓ 100% control of your trading decisions</div>
                            <div>✓ No lock-in periods or forced investments</div>
                            <div>✓ Transparent VIP structure with clear benefits</div>
                            <div>✓ Withdraw your profits anytime you want</div>
                        </div>
                        
                        <p style="margin: 32px 0 8px 0;">We're excited to have you onboard! 🎉</p>
                        <p style="margin: 0; font-weight: 600;">The Token Markets Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>© Token Markets - A Smarter Way to Build Digital Wealth</p>
                        <p style="font-size: 12px; margin-top: 12px;">
                            <a href="#" style="color: #64748b; text-decoration: none; margin: 0 8px;">Terms</a>
                            <a href="#" style="color: #64748b; text-decoration: none; margin: 0 8px;">Privacy</a>
                            <a href="#" style="color: #64748b; text-decoration: none; margin: 0 8px;">Support</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
          `,
          replyTo: {
            email: 'klrrdgw@gmail.com',
            name: 'Token Markets Support'
          }
        })
      });

      const emailData = await sendEmailResponse.json();

      if (sendEmailResponse.ok) {
        return res.status(200).json({ 
          success: true, 
          message: 'Successfully subscribed! Check your email.',
          contactCreated: addContactResponse.status === 201,
          emailSent: true
        });
      } else {
        return res.status(200).json({ 
          success: true, 
          message: 'Subscribed, but email delivery delayed.',
          contactCreated: true,
          emailSent: false,
          emailError: emailData.message
        });
      }

    }

    if (addContactResponse.status === 400 && contactData.code === 'duplicate_parameter') {
      return res.status(200).json({ 
        success: true, 
        message: 'Email already registered!',
        duplicate: true
      });
    }

    return res.status(addContactResponse.status).json({ 
      success: false,
      error: contactData.message || 'Failed to subscribe'
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});


app.post('/api/convert', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          HAS_CONVERTED: true,
          CONVERSION_DATE: new Date().toISOString()
        },
        updateEnabled: true
      })
    });

    if (brevoResponse.ok) {
      return res.status(200).json({ 
        success: true,
        message: 'User converted successfully'
      });
    }

    throw new Error('Failed to update contact');

  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark as converted' });
  }
});

app.listen(PORT, () => {
  console.log(`Token Markets API Server: Server running on: http://localhost:${PORT}`);
});
export default app;
