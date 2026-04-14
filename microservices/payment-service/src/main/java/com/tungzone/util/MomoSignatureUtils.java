package com.tungzone.util;

import com.tungzone.dto.payment.MomoIpnRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public final class MomoSignatureUtils {
    private MomoSignatureUtils() {
    }

    public static String buildIpnRawSignature(MomoIpnRequest request, String accessKey) {
        return "accessKey=" + safe(accessKey)
                + "&amount=" + safe(request.amount())
                + "&extraData=" + safe(request.extraData())
                + "&message=" + safe(request.message())
                + "&orderId=" + safe(request.orderId())
                + "&orderInfo=" + safe(request.orderInfo())
                + "&orderType=" + safe(request.orderType())
                + "&partnerCode=" + safe(request.partnerCode())
                + "&payType=" + safe(request.payType())
                + "&requestId=" + safe(request.requestId())
                + "&responseTime=" + safe(request.responseTime())
                + "&resultCode=" + safe(request.resultCode())
                + "&transId=" + safe(request.transId());
    }

    public static String hmacSha256(String data, String secretKey) {
        try {
            Mac hmacSha256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmacSha256.init(secretKeySpec);
            byte[] hash = hmacSha256.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return toHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to sign data", ex);
        }
    }

    private static String safe(Object value) {
        return value == null ? "" : value.toString();
    }

    private static String toHex(byte[] data) {
        StringBuilder builder = new StringBuilder(data.length * 2);
        for (byte b : data) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }
}
