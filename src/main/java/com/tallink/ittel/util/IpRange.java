package com.tallink.ittel.util;

public class IpRange {
    private String ipStart;
    private String ipEnd;

    public IpRange(String ipStart, String ipEnd) {
        this.ipStart = ipStart;
        this.ipEnd = ipEnd;
    }

    public String getIpStart() {
        return ipStart;
    }

    public String getIpEnd() {
        return ipEnd;
    }
}
