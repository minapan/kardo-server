export const CONFIRMATION_EMAIL = (displayName, verifyUrl, year) => `
  <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 40px; border-radius: 12px;   box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: Arial, sans-serif; text-align: center;">

    <!-- Logo -->
    <img src="https://cdn-icons-png.flaticon.com/512/2504/2504834.png" alt="Kardo Minapan"
      style="width: 80px; height: 80px; margin-bottom: 14px; border-radius: 12px;">

    <!-- Title -->
    <h2 style="color: #333; font-size: 24px; font-weight: bold;">Kardo Minapan</h2>

    <!-- Message -->
    <p style="font-size: 16px; color: #555; line-height: 1.6; max-width: 500px; margin: auto;">
      Hello <strong>${displayName}</strong>,
      welcome to <strong>Kardo Minapan</strong>!
      To complete your registration, please verify your email by clicking the button below.
      (This verification link will expire in 10 minutes)
    </p>

    <!-- Verify Button -->
    <a href="${verifyUrl}" style="display: inline-block; margin: 20px 0; padding: 14px 24px; font-size: 16px; color: #fff; background-color: #778beb; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);">
      Verify My Account
    </a>

    <!-- Additional Info -->
    <p style="font-size: 14px; color: #666; margin-top: 20px; max-width: 500px; margin: auto;">
      If you did not create this account, please ignore this email or
      <a href="mailto:contact@nhatphan.id.vn" style="color: #007bff; text-decoration: none;">contact support</a>.
    </p>

    <!-- Divider -->
    <hr style="border: none; height: 1px; background: #ddd; margin: 30px 0;">

    <!-- Social Media Links -->
    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Follow us on</p>
    <div>
      <a href="https://facebook.com/minapan204" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733547.png" alt="Facebook" style="vertical-align: middle;">
      </a>
      <a href="https://github.com/minapan" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733553.png" alt="GitHub" style="vertical-align: middle;">
      </a>
      <a href="https://linkedin.com/in/minapan/" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733561.png" alt="LinkedIn" style="vertical-align: middle;">
      </a>
    </div>

    <!-- Footer -->
    <p style="font-size: 12px; color: #888; margin-top: 20px;">
      &copy; ${year} MinhNhatPhan. All rights reserved.
    </p>

  </div>
`

export const FORGOT_PASSWORD_EMAIL = (displayName, otpCode, year) => `
  <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: Arial, sans-serif; text-align: center;">

    <!-- Logo -->
    <img src="https://cdn-icons-png.flaticon.com/512/2504/2504834.png" alt="Kardo Minapan"
      style="width: 80px; height: 80px; margin-bottom: 14px; border-radius: 12px;">

    <!-- Title -->
    <h2 style="color: #333; font-size: 24px; font-weight: bold;">Kardo Minapan</h2>

    <!-- Message -->
    <p style="font-size: 16px; color: #555; line-height: 1.6; max-width: 500px; margin: auto;">
      Hello <strong>${displayName}</strong>,
      You have requested to reset your password. Please use the OTP below to proceed.
      (This OTP will expire in 10 minutes, please do not share it with anyone)
    </p>

    <!-- OTP Code -->
    <div style="display: inline-block; margin: 20px 0; padding: 14px 24px; font-size: 18px; font-weight: bold; color: #fff; background-color:rgb(77, 39, 174); border-radius: 8px; letter-spacing: 2px;">
      ${otpCode}
    </div>

    <!-- Additional Info -->
    <p style="font-size: 14px; color: #666; margin-top: 20px; max-width: 500px; margin: auto;">
      If you did not request this, please ignore this email or
      <a href="mailto:contact@nhatphan.id.vn" style="color: #007bff; text-decoration: none;">contact support</a>.
    </p>

    <!-- Divider -->
    <hr style="border: none; height: 1px; background: #ddd; margin: 30px 0;">

    <!-- Social Media Links -->
    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Follow us on</p>
    <div>
      <a href="https://facebook.com/minapan204" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733547.png" alt="Facebook" style="vertical-align: middle;">
      </a>
      <a href="https://github.com/minapan" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733553.png" alt="GitHub" style="vertical-align: middle;">
      </a>
      <a href="https://linkedin.com/in/minapan/" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733561.png" alt="LinkedIn" style="vertical-align: middle;">
      </a>
    </div>

    <!-- Footer -->
    <p style="font-size: 12px; color: #888; margin-top: 20px;">
      &copy; ${year} MinhNhatPhan. All rights reserved.
    </p>

  </div>
`

export const WELCOME_GOOGLE_EMAIL = (displayName, actionUrl, year) => `
  <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: Arial, sans-serif; text-align: center;">

    <!-- Logo -->
    <img src="https://cdn-icons-png.flaticon.com/512/2504/2504834.png" alt="Kardo Minapan"
      style="width: 80px; height: 80px; margin-bottom: 14px; border-radius: 12px;">

    <!-- Title -->
    <h2 style="color: #333; font-size: 24px; font-weight: bold;">Kardo Minapan</h2>

    <!-- Message -->
    <p style="font-size: 16px; color: #555; line-height: 1.6; max-width: 500px; margin: auto;">
      Hello <strong>${displayName}</strong>,
      Welcome to Kardo Minapan! Your account has been successfully created using Google. We're excited to have you on board!
    </p>

    <!-- Call to Action -->
    <div style="display: inline-block; margin: 20px 0; padding: 14px 24px; font-size: 18px; font-weight: bold; color: #fff; background-color: #0079BF; border-radius: 8px; letter-spacing: 1px;">
      <a href=${actionUrl} style="color: #fff; text-decoration: none;">Get Started</a>
    </div>

    <!-- Additional Info -->
    <p style="font-size: 14px; color: #666; margin-top: 20px; max-width: 500px; margin: auto;">
      If you didn&apos;t sign up for this account, please
      <a href="mailto:contact@nhatphan.id.vn" style="color: #007bff; text-decoration: none;">contact support</a>.
    </p>

    <!-- Divider -->
    <hr style="border: none; height: 1px; background: #ddd; margin: 30px 0;">

    <!-- Social Media Links -->
    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Follow us on</p>
    <div>
      <a href="https://facebook.com/minapan204" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733547.png" alt="Facebook" style="vertical-align: middle;">
      </a>
      <a href="https://github.com/minapan" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733553.png" alt="GitHub" style="vertical-align: middle;">
      </a>
      <a href="https://linkedin.com/in/minapan/" target="_blank" style="margin: 0 10px; text-decoration: none;">
        <img src="https://cdn-icons-png.flaticon.com/24/733/733561.png" alt="LinkedIn" style="vertical-align: middle;">
      </a>
    </div>

    <!-- Footer -->
    <p style="font-size: 12px; color: #888; margin-top: 20px;">
      © ${year} MinhNhatPhan. All rights reserved.
    </p>

  </div>
`