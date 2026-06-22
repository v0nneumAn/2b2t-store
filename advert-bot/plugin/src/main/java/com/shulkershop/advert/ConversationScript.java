package com.shulkershop.advert;

import java.util.List;

public class ConversationScript {
    public String id;
    public String topic;
    public List<String> botRoles;
    public List<Line> lines;

    public static class Line {
        public String role;
        public int delayMs;
        public int typingMs;
        public String text;
    }
}
