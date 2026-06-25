package com.deliveryzenith;

import org.jspecify.annotations.Nullable;

import java.util.ArrayList;

public class DeliveryZenithConfig {
    public final DeliveryBotConfig deliveryBot = new DeliveryBotConfig();

    public static final class DeliveryBotConfig {
        public ArrayList<SourceChest> sourceChests = new ArrayList<>();
        public @Nullable Order activeOrder = null;
        public int actionPriority = 1_100_000;
        public int onlineTimeoutSeconds = 7200;
        public int operationTimeoutSeconds = 180;

        // HTTP server config
        public int httpPort = 8080;
        public String pearlBotUrl = "http://pearl-bot:8081";
        public String apiSecret = "";

        // Backend integration
        public String backendUrl = "http://backend:8000";
        public String botKey = "";
        public String botId = "delivery-alpha";
        public int jobPollIntervalSeconds = 10;
        public boolean jobPollingEnabled = true;

        // Optional two-bot stasis pearl reset (requires separate PearlBot account)
        public boolean pearlBotEnabled = false;

        // Pearl staging positions (configured once per stash setup)
        public @Nullable Position pearlChest = null;    // chest that holds ender pearls
        public @Nullable Position stasisChamber = null; // where bot stands to set the pearl (looks down from here)

        public record SourceChest(String id, int x, int y, int z) { }

        /**
         * Represents a batch of shulker boxes to pull from a specific source chest.
         * The source chest is pre-sorted — no item name validation needed.
         */
        public record OrderItem(int count, String sourceChestId) { }

        public record Position(int x, int y, int z) { }

        public static final class Order {
            public String id = "";
            public String orderIGN = "";
            public ArrayList<OrderItem> items = new ArrayList<>();
            public State state = State.NEW;
            public @Nullable Position deliveryLocation = null;
            public @Nullable String status = null;
            public long createdAtEpochMs = System.currentTimeMillis();
            public long updatedAtEpochMs = System.currentTimeMillis();

            /** Backend job id used to report progress; not persisted across config saves. */
            public transient String backendJobId = "";

            public Order() { }

            public Order(final String id, final String orderIGN) {
                this.id = id;
                this.orderIGN = orderIGN;
            }
        }

        public enum State {
            NEW,
            PREPARING,
            ENDER_CHEST_STOCKED,
            KILLING_TO_SPAWN,
            WAITING_FOR_CUSTOMER,
            DELIVERING,
            WAITING_FOR_KILL,
            STAGING_PEARL,   // after customer kill — bot is staging its enderpearl in the stasis chamber
            COMPLETED,
            FAILED,
            CANCELLED
        }
    }
}
