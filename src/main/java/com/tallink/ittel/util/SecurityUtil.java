package com.tallink.ittel.util;

import com.tallink.ittel.web.api.UserData;
import org.apache.log4j.Logger;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import javax.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static java.util.Arrays.asList;

public class SecurityUtil {

    protected static Logger logger = Logger.getLogger(SecurityUtil.class);
    private static final char[] HEXDIGITS = "0123456789abcdef".toCharArray();

    public static String getXForwardedByHeaderValueFromServletRequest(HttpServletRequest request) {
        try {
            return request.getHeader("x-forwarded-for");
        } catch (Exception ex) {
            logger.error("While trying to get httprequest ");
        }
        return null;
    }

    public static boolean isCurrentUserInternalCheckByIp(String ipaddress) {
        if (ipaddress == null) {
            logger.error("Could not find x-forwarded-for http header");
            return false;
        }

        InetAddress addr = null;
        try {
            addr = InetAddress.getByName(ipaddress);
        } catch (UnknownHostException e) {
            logger.error("Failed while resolving IP address " + ipaddress, e);
        }

        if (addr != null) {
            if (addr.isAnyLocalAddress() || addr.isLoopbackAddress() || addr.isSiteLocalAddress()) {
                logger.debug("Detected valid IP address for auto login " + ipaddress);
                logger.debug("Detected valid IP address for auto login " + ipaddress);
                return !isInStaticListOfIpRangeExclusions(ipaddress) && true;
            }
        }

        return false;
    }

    private static boolean isInStaticListOfIpRangeExclusions(String ipAddress) {
        boolean isInAnyIpRange = false;
        for (IpRange ipRange : getStaticIpRange()) {
            isInAnyIpRange = isInIpRange(ipRange.getIpStart(), ipRange.getIpEnd(), ipAddress);

            if (isInAnyIpRange) break;
        }
        return isInAnyIpRange;
    }

    private static List<IpRange> getStaticIpRange() {
        return asList(
                new IpRange("10.100.100.0", "10.100.103.255"),
                new IpRange("10.181.32.0", "10.181.32.255"),
                new IpRange("10.210.32.0", "10.210.33.255"),
                new IpRange("172.18.20.0", "172.18.21.255"),
                new IpRange("172.18.38.0", "172.18.39.255"),
                new IpRange("172.18.6.0", "172.18.7.255"),
                new IpRange("172.26.32.0", "172.26.33.255"),
                new IpRange("192.168.110.0", "192.168.110.255"),
                new IpRange("192.168.118.0", "192.168.118.255"),
                new IpRange("192.168.143.0", "192.168.143.255"),
                new IpRange("192.168.157.0", "192.168.157.255"),
                new IpRange("192.168.158.0", "192.168.158.255"),
                new IpRange("192.168.159.0", "192.168.159.255"),
                new IpRange("192.168.174.0", "192.168.175.255"),
                new IpRange("10.101.32.0", "10.101.33.255"),
                new IpRange("10.102.32.0", "10.102.33.255"),
                new IpRange("10.103.32.0", "10.103.33.255"),
                new IpRange("10.104.42.0", "10.104.42.255"),
                new IpRange("10.104.7.0", "10.104.7.255"),
                new IpRange("10.105.32.0", "10.105.33.255"),
                new IpRange("10.106.32.0", "10.106.33.255"),
                new IpRange("10.107.32.0", "10.107.33.255"),
                new IpRange("10.108.32.0", "10.108.33.255"),
                new IpRange("10.109.32.0", "10.109.33.255"),
                new IpRange("10.111.32.0", "10.111.33.255"),
                new IpRange("10.112.32.0", "10.112.33.255"),
                new IpRange("10.113.32.0", "10.113.33.255"),
                new IpRange("172.20.13.0", "172.20.13.255"),
                new IpRange("172.20.14.0", "172.20.14.255"),
                new IpRange("192.168.33.0", "192.168.33.255"),
                new IpRange("192.168.89.0", "192.168.89.255"),
                new IpRange("192.168.18.0", "192.168.18.255"),
                new IpRange("10.116.232.0", "10.116.248.255")
        );

    }

    private static long ipToLong(InetAddress ip) {
        byte[] octets = ip.getAddress();
        long result = 0;
        for (byte octet : octets) {
            result <<= 8;
            result |= octet & 0xff;
        }
        return result;
    }

    public static boolean isInIpRange(String ipStart, String ipEnd,
                                      String ipToCheck) {
        try {
            long ipLo = ipToLong(InetAddress.getByName(ipStart));
            long ipHi = ipToLong(InetAddress.getByName(ipEnd));
            long ipToTest = ipToLong(InetAddress.getByName(ipToCheck));
            return (ipToTest >= ipLo && ipToTest <= ipHi);
        } catch (UnknownHostException e) {
            logger.error("Error in isInIpRange: ipStart=" + ipStart + ",ipEnd " + ipEnd +",ipToCheck = " + ipToCheck, e);
            return false;
        }
    }

    public static UserData getAuthUser() {

        String username = null;
        UserData userdata = null;
        Collection authorities  = new ArrayList<GrantedAuthority>();
        try {
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                if (SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
                    username = SecurityContextHolder.getContext().getAuthentication().getName();
                    authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
                    userdata = (UserData)SecurityContextHolder.getContext().getAuthentication().getDetails();
                    userdata.setUsername(username);
                    userdata.setAuthorities(authorities);
                }else{
                    logger.info("GetAuthUser: Not authenticated");
                }
            }else{
                logger.info("GetAuthUser : No authentication");
            }
        } catch (Exception ex) {
            logger.error("Error while trying get Auth user", ex);
        }

        return userdata;
    }

    public static UsernamePasswordAuthenticationToken getAuthUserToken() {

        try {
            return (UsernamePasswordAuthenticationToken)SecurityContextHolder.getContext().getAuthentication();
        } catch (Exception ex) {
            logger.error("Error while trying get Auth user token", ex);
        }
        return null;
    }

    public static String toHexString(byte[] bytes) {

        if (bytes.length == 0) return "";
        StringBuilder sb = new StringBuilder(bytes.length * 3);
        for (int b : bytes) {
            b &= 0xff;
            sb.append(HEXDIGITS[b >> 4]);
            sb.append(HEXDIGITS[b & 15]);
            sb.append(' ');

        }
        return sb.toString();
    }


}