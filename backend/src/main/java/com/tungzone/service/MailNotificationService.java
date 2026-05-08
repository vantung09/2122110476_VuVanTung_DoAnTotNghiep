package com.tungzone.service;

import com.tungzone.entity.Order;
import com.tungzone.entity.OrderItem;
import com.tungzone.entity.Product;
import com.tungzone.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailNotificationService {
    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@tungzone.local}")
    private String mailFrom;

    @Value("${app.frontend.reset-password-url:http://localhost:5173/login}")
    private String resetPasswordUrl;

    @Value("${app.frontend.orders-url:http://localhost:5173/profile?tab=orders}")
    private String ordersUrl;

    public boolean sendPasswordReset(String email, String token) {
        String subject = "TungZone - M\u00e3 x\u00e1c th\u1ef1c \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u";
        String body = "Xin ch\u00e0o,\n\n"
                + "M\u00e3 x\u00e1c th\u1ef1c \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u c\u1ee7a b\u1ea1n l\u00e0: " + token + "\n"
                + "M\u00e3 c\u00f3 hi\u1ec7u l\u1ef1c trong 30 ph\u00fat.\n\n"
                + "B\u1ea1n c\u00f3 th\u1ec3 quay l\u1ea1i trang \u0111\u0103ng nh\u1eadp \u0111\u1ec3 nh\u1eadp m\u00e3 x\u00e1c th\u1ef1c: " + resetPasswordUrl + "\n\n"
                + "N\u1ebfu b\u1ea1n kh\u00f4ng y\u00eau c\u1ea7u, vui l\u00f2ng b\u1ecf qua email n\u00e0y.\n"
                + "TungZone";
        String html = buildPasswordResetHtml(token);
        return send(email, subject, body, html, true);
    }

    public void sendPaymentCreated(String email, Order order) {
        if (order == null) {
            return;
        }
        String subject = "TungZone - X\u00e1c nh\u1eadn \u0111\u01a1n h\u00e0ng #" + order.getId();
        String body = "Xin chao,\n\n"
                + "Don hang #" + order.getId() + " da duoc ghi nhan tren TungZone.\n"
                + "Tong thanh toan: " + formatMoney(order.getTotalAmount()) + "\n"
                + "Trang thai: " + statusLabel(order.getStatus() != null ? order.getStatus().name() : "") + "\n"
                + "Thoi gian tao: " + formatDate(order) + "\n\n"
                + "Cam on ban da mua sam tai TungZone.";
        send(email, subject, body, buildOrderStatusHtml(
                order,
                "&#272;&#417;n h&agrave;ng c&#7911;a b&#7841;n",
                "&#273;&atilde; &#273;&#432;&#7907;c ghi nh&#7853;n",
                "&#128717;&#65039;",
                "TungZone &#273;&atilde; ghi nh&#7853;n &#273;&#417;n h&agrave;ng c&#7911;a b&#7841;n. Ch&uacute;ng t&ocirc;i s&#7869; ki&#7875;m tra v&agrave; x&#7917; l&yacute; trong th&#7901;i gian s&#7899;m nh&#7845;t.",
                "#1d4ed8",
                null,
                "Xem chi ti&#7871;t &#273;&#417;n h&agrave;ng"
        ), false);
    }

    public void sendPaymentConfirmed(String email, Order order) {
        if (order == null) {
            return;
        }
        String subject = "TungZone - Thanh to\u00e1n th\u00e0nh c\u00f4ng cho \u0111\u01a1n h\u00e0ng #" + order.getId();
        String body = "Xin chao,\n\n"
                + "TungZone da ghi nhan thanh toan thanh cong cho don hang #" + order.getId() + ".\n"
                + "Tong tien: " + formatMoney(order.getTotalAmount()) + "\n"
                + "Trang thai don hang: " + statusLabel(order.getStatus() != null ? order.getStatus().name() : "") + "\n\n"
                + "Chung toi se tiep tuc xu ly va cap nhat don hang cua ban.";
        send(email, subject, body, buildOrderStatusHtml(
                order,
                "Thanh to&aacute;n",
                "&#273;&atilde; th&agrave;nh c&ocirc;ng",
                "&#9989;",
                "TungZone &#273;&atilde; ghi nh&#7853;n thanh to&aacute;n c&#7911;a b&#7841;n. &#272;&#417;n h&agrave;ng s&#7869; ti&#7871;p t&#7909;c &#273;&#432;&#7907;c x&#7917; l&yacute; v&agrave; c&#7853;p nh&#7853;t tr&ecirc;n h&#7879; th&#7889;ng.",
                "#16a34a",
                null,
                "Theo d&otilde;i &#273;&#417;n h&agrave;ng"
        ), false);
    }

    public void sendPaymentFailed(String email, Order order, String reason) {
        if (order == null) {
            return;
        }
        String subject = "TungZone - Thanh to\u00e1n ch\u01b0a th\u00e0nh c\u00f4ng cho \u0111\u01a1n h\u00e0ng #" + order.getId();
        String body = "Xin chao,\n\n"
                + "Thanh toan cho don hang #" + order.getId() + " chua thanh cong.\n"
                + "Tong tien: " + formatMoney(order.getTotalAmount()) + "\n"
                + "Trang thai don hang: " + statusLabel(order.getStatus() != null ? order.getStatus().name() : "") + "\n"
                + "Ly do: " + (reason == null || reason.isBlank() ? "Giao dich bi huy hoac chua duoc xac nhan." : reason) + "\n\n"
                + "Ban co the quay lai gio hang/don hang de thu thanh toan lai hoac chon phuong thuc khac.\n"
                + "TungZone";
        send(email, subject, body, buildOrderStatusHtml(
                order,
                "Thanh to&aacute;n",
                "ch&#432;a th&agrave;nh c&ocirc;ng",
                "&#9888;&#65039;",
                "Giao d&#7883;ch thanh to&aacute;n ch&#432;a ho&agrave;n t&#7845;t. B&#7841;n c&oacute; th&#7875; quay l&#7841;i &#273;&#417;n h&agrave;ng &#273;&#7875; th&#7917; thanh to&aacute;n l&#7841;i ho&#7863;c ch&#7885;n ph&#432;&#417;ng th&#7913;c kh&aacute;c.",
                "#dc2626",
                reason,
                "Xem l&#7841;i &#273;&#417;n h&agrave;ng"
        ), false);
    }

    private boolean send(String to, String subject, String textBody, String htmlBody, boolean required) {
        if (to == null || to.isBlank()) {
            return false;
        }
        if (!mailEnabled) {
            log.info("Mail demo to={} subject={} body={}", to, subject, textBody);
            return false;
        }
        if (!hasSmtpConfig()) {
            String message = "Da bat MAIL_ENABLED=true nhung chua cau hinh du MAIL_HOST, MAIL_USERNAME va MAIL_PASSWORD.";
            if (required) {
                throw new IllegalStateException(message);
            }
            log.warn(message);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveMailFrom());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            mailSender.send(message);
            return true;
        } catch (Exception exception) {
            String message = "Khong gui duoc email den " + to + ": " + exception.getMessage();
            if (required) {
                throw new IllegalStateException(message);
            }
            log.warn(message);
            return false;
        }
    }

    private boolean hasSmtpConfig() {
        return mailProperties.getHost() != null
                && !mailProperties.getHost().isBlank()
                && mailProperties.getUsername() != null
                && !mailProperties.getUsername().isBlank()
                && mailProperties.getPassword() != null
                && !mailProperties.getPassword().isBlank();
    }

    private String resolveMailFrom() {
        if (mailFrom != null && !mailFrom.isBlank()) {
            return mailFrom;
        }
        return mailProperties.getUsername();
    }

    private String buildPasswordResetHtml(String token) {
        String safeToken = escapeHtml(formatOtpCode(token));
        String safeResetUrl = escapeHtml(resetPasswordUrl);

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>M&atilde; x&aacute;c th&#7921;c &#273;&#7863;t l&#7841;i m&#7853;t kh&#7849;u</title>
                </head>
                <body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3fb;padding:40px 16px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,0.14);">
                                    <tr>
                                        <td style="padding:0;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#071b4f;background:linear-gradient(135deg,#06122d 0%,#071b4f 52%,#0c3da3 100%);">
                                                <tr>
                                                    <td style="padding:34px 44px 40px 44px;">
                                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                            <tr>
                                                                <td style="vertical-align:top;">
                                                                    <div style="font-size:14px;letter-spacing:4px;font-weight:800;color:#9fc2ff;margin-bottom:34px;">TUNGZONE</div>
                                                                    <div style="font-size:40px;line-height:1.12;font-weight:900;color:#ffffff;letter-spacing:-1px;">M&atilde; x&aacute;c th&#7921;c</div>
                                                                    <div style="font-size:38px;line-height:1.12;font-weight:900;color:#80aaff;letter-spacing:-1px;margin-top:4px;">&#273;&#7863;t l&#7841;i m&#7853;t kh&#7849;u</div>
                                                                </td>
                                                                <td width="150" align="right" style="vertical-align:middle;">
                                                                    <div style="width:118px;height:118px;border-radius:32px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);box-shadow:inset 0 0 30px rgba(96,165,250,0.25);text-align:center;line-height:118px;font-size:58px;">&#128274;</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:42px 44px 20px 44px;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td>
                                                        <div style="font-size:24px;line-height:1.35;font-weight:800;color:#0f172a;margin-bottom:18px;">Xin ch&agrave;o,</div>
                                                    </td>
                                                    <td align="right" style="vertical-align:top;">
                                                        <div style="display:inline-block;padding:10px 16px;border-radius:999px;background:#eef4ff;color:#1d4ed8;font-size:14px;font-weight:800;white-space:nowrap;">&#9201; Hi&#7879;u l&#7921;c: 30 ph&uacute;t</div>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="font-size:16px;line-height:1.75;color:#475569;margin-bottom:30px;">
                                                B&#7841;n v&#7915;a y&ecirc;u c&#7847;u &#273;&#7863;t l&#7841;i m&#7853;t kh&#7849;u cho t&agrave;i kho&#7843;n <strong style="color:#0f172a;">TungZone</strong>.
                                                Vui l&ograve;ng s&#7917; d&#7909;ng m&atilde; x&aacute;c th&#7921;c b&ecirc;n d&#432;&#7899;i &#273;&#7875; ti&#7871;p t&#7909;c.
                                                M&atilde; s&#7869; h&#7871;t h&#7841;n sau <strong style="color:#0f172a;">30 ph&uacute;t</strong>.
                                            </div>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
                                                <tr>
                                                    <td style="border:1px solid #bfdbfe;background:#edf5ff;background:linear-gradient(180deg,#f8fbff 0%,#edf5ff 100%);border-radius:22px;padding:28px 18px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.9);">
                                                        <div style="text-align:center;font-size:13px;line-height:1;letter-spacing:6px;font-weight:900;color:#2563eb;margin-bottom:20px;">M&Atilde; X&Aacute;C TH&#7920;C</div>
                                                        <div style="text-align:center;font-size:54px;line-height:1;letter-spacing:12px;font-weight:900;color:#06184a;font-family:Consolas,Menlo,monospace;">{{RESET_TOKEN}}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:30px;">
                                                <tr>
                                                    <td width="44" style="vertical-align:top;">
                                                        <div style="width:34px;height:34px;border-radius:50%;background:#eff6ff;color:#2563eb;text-align:center;line-height:34px;font-size:17px;">&#128737;</div>
                                                    </td>
                                                    <td style="font-size:15px;line-height:1.6;color:#475569;">Vui l&ograve;ng kh&ocirc;ng chia s&#7867; m&atilde; n&agrave;y v&#7899;i b&#7845;t k&#7923; ai &#273;&#7875; b&#7843;o v&#7879; t&agrave;i kho&#7843;n c&#7911;a b&#7841;n.</td>
                                                </tr>
                                            </table>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 34px auto;">
                                                <tr>
                                                    <td align="center" style="border-radius:18px;background:#0b2d78;background:linear-gradient(135deg,#06122d 0%,#0b2d78 100%);box-shadow:0 14px 28px rgba(15,23,42,0.22);">
                                                        <a href="{{RESET_URL}}" target="_blank" style="display:inline-block;padding:18px 34px;min-width:280px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:900;border-radius:18px;">&#8618; Quay l&#7841;i trang &#273;&#259;ng nh&#7853;p</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 28px 0;">
                                                <tr>
                                                    <td style="height:1px;background:#dbe7f5;"></td>
                                                    <td width="54" align="center">
                                                        <div style="width:34px;height:34px;border-radius:50%;background:#f1f5f9;color:#64748b;line-height:34px;text-align:center;">&#128274;</div>
                                                    </td>
                                                    <td style="height:1px;background:#dbe7f5;"></td>
                                                </tr>
                                            </table>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:30px;">
                                                <tr>
                                                    <td width="44" style="vertical-align:top;">
                                                        <div style="width:34px;height:34px;border-radius:50%;border:1px solid #93c5fd;color:#2563eb;text-align:center;line-height:34px;font-size:17px;">i</div>
                                                    </td>
                                                    <td style="font-size:15px;line-height:1.7;color:#64748b;">N&#7871;u b&#7841;n kh&ocirc;ng y&ecirc;u c&#7847;u &#273;&#7863;t l&#7841;i m&#7853;t kh&#7849;u, vui l&ograve;ng b&#7887; qua email n&agrave;y ho&#7863;c li&ecirc;n h&#7879; b&#7897; ph&#7853;n h&#7895; tr&#7907; c&#7911;a ch&uacute;ng t&ocirc;i.</td>
                                                </tr>
                                            </table>
                                            <div style="background:#f1f6ff;border-radius:16px;padding:18px 20px;color:#64748b;font-size:14px;line-height:1.6;">&#9993;&#65039; &nbsp; Email n&agrave;y &#273;&#432;&#7907;c g&#7917;i t&#7921; &#273;&#7897;ng t&#7915; h&#7879; th&#7889;ng TungZone.</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:34px;"></td>
                                    </tr>
                                </table>
                                <div style="max-width:680px;padding:18px 12px 0 12px;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">&copy; TungZone. Vui l&ograve;ng kh&ocirc;ng tr&#7843; l&#7901;i email t&#7921; &#273;&#7897;ng n&agrave;y.</div>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """;
        return html
                .replace("{{RESET_TOKEN}}", safeToken)
                .replace("{{RESET_URL}}", safeResetUrl);
    }

    private String formatOtpCode(String token) {
        if (token == null || token.isBlank()) {
            return "";
        }
        return String.join(" ", token.trim().split(""));
    }

    private String buildOrderStatusHtml(
            Order order,
            String headingLineOneHtml,
            String headingLineTwoHtml,
            String iconHtml,
            String introHtml,
            String statusColor,
            String reason,
            String ctaLabelHtml
    ) {
        User user = safeUser(order);
        String orderId = order.getId() == null ? "#--" : "#" + order.getId();
        String customerName = user != null ? safeText(user.getFullName()) : "Kh&aacute;ch h&agrave;ng";
        String customerEmail = user != null ? safeText(user.getEmail()) : "&#272;ang c&#7853;p nh&#7853;t";
        String customerPhone = user != null ? safeText(user.getPhoneNumber()) : "&#272;ang c&#7853;p nh&#7853;t";
        String customerAddress = user != null ? safeText(user.getAddress()) : "&#272;ang c&#7853;p nh&#7853;t";
        String orderDate = escapeHtml(formatDate(order));
        String status = escapeHtml(statusLabel(order.getStatus() != null ? order.getStatus().name() : ""));
        String totalAmount = escapeHtml(formatMoney(order.getTotalAmount()));
        String orderLink = escapeHtml(resolveOrderLink(order));
        String itemsHtml = buildOrderItemsRows(order);
        String reasonHtml = buildReasonHtml(reason, statusColor);

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>TungZone - Th&ocirc;ng tin &#273;&#417;n h&agrave;ng</title>
                </head>
                <body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3fb;padding:40px 16px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px;background:#ffffff;border-radius:30px;overflow:hidden;box-shadow:0 28px 80px rgba(15,23,42,0.16);">
                                    <tr>
                                        <td style="padding:0;">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#08256b;background:linear-gradient(135deg,#06122d 0%,#08256b 55%,#1558d6 100%);">
                                                <tr>
                                                    <td style="padding:34px 42px 38px 42px;">
                                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                            <tr>
                                                                <td style="vertical-align:top;">
                                                                    <div style="font-size:14px;letter-spacing:4px;font-weight:900;color:#9fc2ff;margin-bottom:30px;">TUNGZONE</div>
                                                                    <div style="font-size:38px;line-height:1.15;font-weight:900;color:#ffffff;letter-spacing:-0.8px;">{{HEADING_ONE}}</div>
                                                                    <div style="font-size:38px;line-height:1.15;font-weight:900;color:#84b4ff;letter-spacing:-0.8px;margin-top:4px;">{{HEADING_TWO}}</div>
                                                                    <div style="margin-top:22px;display:inline-block;padding:10px 16px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);color:#dbeafe;font-size:14px;font-weight:800;">M&atilde; &#273;&#417;n h&agrave;ng: {{ORDER_ID}}</div>
                                                                </td>
                                                                <td width="150" align="right" style="vertical-align:middle;">
                                                                    <div style="width:118px;height:118px;border-radius:34px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);box-shadow:inset 0 0 34px rgba(96,165,250,0.28);text-align:center;line-height:118px;font-size:58px;">{{ICON}}</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:40px 42px 22px 42px;">
                                            <div style="font-size:24px;line-height:1.35;font-weight:900;color:#0f172a;margin-bottom:14px;">C&#7843;m &#417;n {{CUSTOMER_NAME}}!</div>
                                            <div style="font-size:16px;line-height:1.75;color:#475569;margin-bottom:26px;">{{INTRO}}</div>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                                                <tr>
                                                    <td width="50%" style="padding:0 8px 12px 0;">
                                                        <div style="background:#f8fbff;border:1px solid #dbeafe;border-radius:18px;padding:18px;">
                                                            <div style="font-size:12px;letter-spacing:1.6px;font-weight:900;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Ng&agrave;y &#273;&#7863;t</div>
                                                            <div style="font-size:16px;font-weight:900;color:#0f172a;">{{ORDER_DATE}}</div>
                                                        </div>
                                                    </td>
                                                    <td width="50%" style="padding:0 0 12px 8px;">
                                                        <div style="background:#f8fbff;border:1px solid #dbeafe;border-radius:18px;padding:18px;">
                                                            <div style="font-size:12px;letter-spacing:1.6px;font-weight:900;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Tr&#7841;ng th&aacute;i</div>
                                                            <div style="font-size:16px;font-weight:900;color:{{STATUS_COLOR}};">{{STATUS}}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td width="50%" style="padding:0 8px 0 0;">
                                                        <div style="background:#f8fbff;border:1px solid #dbeafe;border-radius:18px;padding:18px;">
                                                            <div style="font-size:12px;letter-spacing:1.6px;font-weight:900;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Kh&aacute;ch h&agrave;ng</div>
                                                            <div style="font-size:15px;line-height:1.6;color:#334155;"><strong style="color:#0f172a;">{{CUSTOMER_NAME}}</strong><br>{{CUSTOMER_EMAIL}}</div>
                                                        </div>
                                                    </td>
                                                    <td width="50%" style="padding:0 0 0 8px;">
                                                        <div style="background:#f8fbff;border:1px solid #dbeafe;border-radius:18px;padding:18px;">
                                                            <div style="font-size:12px;letter-spacing:1.6px;font-weight:900;color:#64748b;text-transform:uppercase;margin-bottom:8px;">S&#7889; &#273;i&#7879;n tho&#7841;i</div>
                                                            <div style="font-size:15px;line-height:1.6;color:#334155;">{{CUSTOMER_PHONE}}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="background:#f1f6ff;border-radius:18px;padding:18px 20px;margin-bottom:30px;border:1px solid #e0ecff;">
                                                <div style="font-size:12px;letter-spacing:1.6px;font-weight:900;color:#64748b;text-transform:uppercase;margin-bottom:8px;">&#272;&#7883;a ch&#7881; nh&#7853;n h&agrave;ng</div>
                                                <div style="font-size:15px;line-height:1.7;color:#334155;">{{CUSTOMER_ADDRESS}}</div>
                                            </div>
                                            {{REASON_BLOCK}}
                                            <div style="font-size:20px;line-height:1.35;font-weight:900;color:#0f172a;margin-bottom:16px;">S&#7843;n ph&#7849;m &#273;&atilde; &#273;&#7863;t</div>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;margin-bottom:26px;">
                                                <tr>
                                                    <td style="background:#f8fafc;padding:14px 18px;font-size:12px;letter-spacing:1.3px;font-weight:900;color:#64748b;text-transform:uppercase;">S&#7843;n ph&#7849;m</td>
                                                    <td align="center" width="80" style="background:#f8fafc;padding:14px 10px;font-size:12px;letter-spacing:1.3px;font-weight:900;color:#64748b;text-transform:uppercase;">SL</td>
                                                    <td align="right" width="130" style="background:#f8fafc;padding:14px 18px;font-size:12px;letter-spacing:1.3px;font-weight:900;color:#64748b;text-transform:uppercase;">Th&agrave;nh ti&#7873;n</td>
                                                </tr>
                                                {{ITEMS}}
                                            </table>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:32px;">
                                                <tr>
                                                    <td></td>
                                                    <td width="320">
                                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5ff;background:linear-gradient(180deg,#f8fbff 0%,#eef5ff 100%);border:1px solid #bfdbfe;border-radius:20px;">
                                                            <tr>
                                                                <td style="padding:18px 20px;font-size:15px;color:#475569;">T&#7893;ng thanh to&aacute;n</td>
                                                                <td align="right" style="padding:18px 20px;font-size:22px;font-weight:900;color:#06184a;">{{TOTAL_AMOUNT}}</td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 34px auto;">
                                                <tr>
                                                    <td align="center" style="border-radius:18px;background:#0b2d78;background:linear-gradient(135deg,#06122d 0%,#0b2d78 100%);box-shadow:0 14px 28px rgba(15,23,42,0.22);">
                                                        <a href="{{ORDER_LINK}}" target="_blank" style="display:inline-block;padding:18px 34px;min-width:260px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:900;border-radius:18px;">{{CTA_LABEL}}</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:20px;margin-bottom:28px;">
                                                <div style="font-size:17px;font-weight:900;color:#0f172a;margin-bottom:16px;">Quy tr&igrave;nh x&#7917; l&yacute; &#273;&#417;n h&agrave;ng</div>
                                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                    <tr>
                                                        <td align="center" width="25%" style="font-size:13px;line-height:1.5;color:#1d4ed8;font-weight:800;"><div style="width:34px;height:34px;line-height:34px;border-radius:50%;background:#dbeafe;margin:0 auto 8px auto;">1</div>&#272;&atilde; &#273;&#7863;t</td>
                                                        <td align="center" width="25%" style="font-size:13px;line-height:1.5;color:#64748b;font-weight:800;"><div style="width:34px;height:34px;line-height:34px;border-radius:50%;background:#f1f5f9;margin:0 auto 8px auto;">2</div>X&aacute;c nh&#7853;n</td>
                                                        <td align="center" width="25%" style="font-size:13px;line-height:1.5;color:#64748b;font-weight:800;"><div style="width:34px;height:34px;line-height:34px;border-radius:50%;background:#f1f5f9;margin:0 auto 8px auto;">3</div>Giao h&agrave;ng</td>
                                                        <td align="center" width="25%" style="font-size:13px;line-height:1.5;color:#64748b;font-weight:800;"><div style="width:34px;height:34px;line-height:34px;border-radius:50%;background:#f1f5f9;margin:0 auto 8px auto;">4</div>Ho&agrave;n t&#7845;t</td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:30px;">
                                                <tr>
                                                    <td width="44" style="vertical-align:top;"><div style="width:34px;height:34px;border-radius:50%;background:#eff6ff;color:#2563eb;text-align:center;line-height:34px;font-size:17px;">i</div></td>
                                                    <td style="font-size:15px;line-height:1.7;color:#64748b;">N&#7871;u th&ocirc;ng tin &#273;&#417;n h&agrave;ng ch&#432;a ch&iacute;nh x&aacute;c, vui l&ograve;ng li&ecirc;n h&#7879; TungZone &#273;&#7875; &#273;&#432;&#7907;c h&#7895; tr&#7907; tr&#432;&#7899;c khi &#273;&#417;n h&agrave;ng &#273;&#432;&#7907;c giao.</td>
                                                </tr>
                                            </table>
                                            <div style="background:#f1f6ff;border-radius:16px;padding:18px 20px;color:#64748b;font-size:14px;line-height:1.6;">Email n&agrave;y &#273;&#432;&#7907;c g&#7917;i t&#7921; &#273;&#7897;ng t&#7915; h&#7879; th&#7889;ng TungZone. C&#7843;m &#417;n b&#7841;n &#273;&atilde; mua s&#7855;m c&ugrave;ng ch&uacute;ng t&ocirc;i.</div>
                                        </td>
                                    </tr>
                                    <tr><td style="height:34px;"></td></tr>
                                </table>
                                <div style="max-width:720px;padding:18px 12px 0 12px;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">&copy; TungZone. Vui l&ograve;ng kh&ocirc;ng tr&#7843; l&#7901;i email t&#7921; &#273;&#7897;ng n&agrave;y.</div>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """;
        return html
                .replace("{{HEADING_ONE}}", headingLineOneHtml)
                .replace("{{HEADING_TWO}}", headingLineTwoHtml)
                .replace("{{ICON}}", iconHtml)
                .replace("{{ORDER_ID}}", escapeHtml(orderId))
                .replace("{{INTRO}}", introHtml)
                .replace("{{STATUS_COLOR}}", escapeHtml(statusColor))
                .replace("{{STATUS}}", status)
                .replace("{{CUSTOMER_NAME}}", customerName)
                .replace("{{CUSTOMER_EMAIL}}", customerEmail)
                .replace("{{CUSTOMER_PHONE}}", customerPhone)
                .replace("{{CUSTOMER_ADDRESS}}", customerAddress)
                .replace("{{ORDER_DATE}}", orderDate)
                .replace("{{REASON_BLOCK}}", reasonHtml)
                .replace("{{ITEMS}}", itemsHtml)
                .replace("{{TOTAL_AMOUNT}}", totalAmount)
                .replace("{{ORDER_LINK}}", orderLink)
                .replace("{{CTA_LABEL}}", ctaLabelHtml);
    }

    private String buildReasonHtml(String reason, String statusColor) {
        if (reason == null || reason.isBlank()) {
            return "";
        }
        return """
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px 20px;margin-bottom:30px;">
                    <div style="font-size:12px;letter-spacing:1.6px;font-weight:900;color:%s;text-transform:uppercase;margin-bottom:8px;">L&yacute; do</div>
                    <div style="font-size:15px;line-height:1.7;color:#334155;">%s</div>
                </div>
                """.formatted(escapeHtml(statusColor), escapeHtml(reason));
    }

    private String buildOrderItemsRows(Order order) {
        List<OrderItem> items = safeOrderItems(order);
        if (items.isEmpty()) {
            return """
                    <tr>
                        <td colspan="3" style="padding:22px 18px;font-size:15px;color:#64748b;text-align:center;">Ch&#432;a c&oacute; th&ocirc;ng tin s&#7843;n ph&#7849;m.</td>
                    </tr>
                    """;
        }

        StringBuilder rows = new StringBuilder();
        for (OrderItem item : items) {
            Product product = safeProduct(item, order.getId());
            String productName = "S&#7843;n ph&#7849;m";
            String brand = "";
            String imageUrl = "";
            if (product != null) {
                try {
                    productName = safeText(product.getName());
                    brand = safeText(product.getBrand());
                    imageUrl = escapeHtml(product.getImageUrl());
                } catch (RuntimeException exception) {
                    log.warn("Khong doc duoc chi tiet product cho email don hang #{}: {}", order.getId(), exception.getMessage());
                }
            }
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            double price = item.getPrice() != null ? item.getPrice() : 0;
            double lineTotal = price * quantity;
            String imageHtml = buildProductImageHtml(imageUrl, productName);

            rows.append("""
                    <tr>
                        <td style="padding:16px 18px;border-top:1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="66" style="vertical-align:top;">{{IMAGE}}</td>
                                    <td style="vertical-align:top;">
                                        <div style="font-size:15px;line-height:1.45;font-weight:900;color:#0f172a;">{{PRODUCT_NAME}}</div>
                                        <div style="font-size:13px;line-height:1.5;color:#64748b;margin-top:4px;">{{BRAND}}</div>
                                        <div style="font-size:13px;line-height:1.5;color:#475569;margin-top:6px;">&#272;&#417;n gi&aacute;: <strong style="color:#0f172a;">{{PRICE}}</strong></div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td align="center" style="padding:16px 10px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:900;color:#0f172a;">{{QUANTITY}}</td>
                        <td align="right" style="padding:16px 18px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:900;color:#0f172a;">{{LINE_TOTAL}}</td>
                    </tr>
                    """
                    .replace("{{IMAGE}}", imageHtml)
                    .replace("{{PRODUCT_NAME}}", productName)
                    .replace("{{BRAND}}", isBlank(brand) ? "TungZone" : brand)
                    .replace("{{PRICE}}", escapeHtml(formatMoney(price)))
                    .replace("{{QUANTITY}}", String.valueOf(quantity))
                    .replace("{{LINE_TOTAL}}", escapeHtml(formatMoney(lineTotal))));
        }
        return rows.toString();
    }

    private String buildProductImageHtml(String imageUrl, String productName) {
        if (!isHttpUrl(imageUrl)) {
            return """
                    <div style="width:54px;height:54px;border-radius:14px;background:#eef4ff;text-align:center;line-height:54px;font-size:24px;">&#128230;</div>
                    """;
        }
        return """
                <img src="{{IMAGE_URL}}" alt="{{PRODUCT_NAME}}" width="54" height="54" style="display:block;width:54px;height:54px;object-fit:cover;border-radius:14px;border:1px solid #e2e8f0;">
                """
                .replace("{{IMAGE_URL}}", imageUrl)
                .replace("{{PRODUCT_NAME}}", productName);
    }

    private User safeUser(Order order) {
        try {
            return order.getUser();
        } catch (RuntimeException exception) {
            log.warn("Khong doc duoc thong tin user cho email don hang #{}: {}", order.getId(), exception.getMessage());
            return null;
        }
    }

    private List<OrderItem> safeOrderItems(Order order) {
        try {
            if (order.getItems() == null) {
                return List.of();
            }
            return List.copyOf(order.getItems());
        } catch (RuntimeException exception) {
            log.warn("Khong doc duoc san pham cho email don hang #{}: {}", order.getId(), exception.getMessage());
            return List.of();
        }
    }

    private Product safeProduct(OrderItem item, Long orderId) {
        try {
            return item.getProduct();
        } catch (RuntimeException exception) {
            log.warn("Khong doc duoc product cho email don hang #{}: {}", orderId, exception.getMessage());
            return null;
        }
    }

    private String resolveOrderLink(Order order) {
        String link = isBlank(ordersUrl) ? "http://localhost:5173/profile?tab=orders" : ordersUrl.trim();
        if (order.getId() != null && link.contains("{id}")) {
            return link.replace("{id}", String.valueOf(order.getId()));
        }
        return link;
    }

    private String statusLabel(String status) {
        if (status == null || status.isBlank()) {
            return "\u0110ang x\u1eed l\u00fd";
        }
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "PENDING" -> "Ch\u1edd x\u00e1c nh\u1eadn";
            case "CONFIRMED" -> "\u0110\u00e3 x\u00e1c nh\u1eadn";
            case "SHIPPING" -> "\u0110ang giao h\u00e0ng";
            case "COMPLETED" -> "\u0110\u00e3 ho\u00e0n th\u00e0nh";
            case "CANCELLED" -> "\u0110\u00e3 h\u1ee7y";
            default -> status;
        };
    }

    private String safeText(String value) {
        if (isBlank(value)) {
            return "&#272;ang c&#7853;p nh&#7853;t";
        }
        return escapeHtml(value.trim());
    }

    private boolean isHttpUrl(String value) {
        if (isBlank(value)) {
            return false;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("http://") || normalized.startsWith("https://");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String formatMoney(Double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        return formatter.format(amount != null ? amount : 0);
    }

    private String formatDate(Order order) {
        if (order.getCreatedAt() == null) {
            return "Dang cap nhat";
        }
        return order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }
}
