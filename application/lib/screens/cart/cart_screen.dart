import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../models/cart.dart';
import '../../services/cart_service.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _cartService = CartService();

  Cart? _cart;
  bool _isLoading = true;
  String? _error;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final response = await _cartService.getCart();

    if (!mounted) return;

    if (response.success && response.data != null) {
      setState(() {
        _cart = response.data;
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response.message ?? 'Failed to load cart';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateQuantity(String itemId, int newQuantity) async {
    if (_isUpdating) return;
    setState(() => _isUpdating = true);

    final response = await _cartService.updateQuantity(
      itemId: itemId,
      quantity: newQuantity,
    );

    if (!mounted) return;
    setState(() => _isUpdating = false);

    if (response.success && response.data != null) {
      setState(() => _cart = response.data);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Failed to update quantity'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  Future<void> _removeItem(String itemId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Item'),
        content: const Text('Remove this item from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.accentColor),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    setState(() => _isUpdating = true);

    final response = await _cartService.removeFromCart(itemId);

    if (!mounted) return;
    setState(() => _isUpdating = false);

    if (response.success && response.data != null) {
      setState(() => _cart = response.data);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Item removed from cart'),
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message ?? 'Failed to remove item'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            )
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(AppTheme.spacing32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.wifi_off_rounded,
                      size: 64,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(height: AppTheme.spacing16),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: AppTheme.spacing24),
                    ElevatedButton(
                      onPressed: _loadCart,
                      child: const Text('Try Again'),
                    ),
                  ],
                ),
              ),
            )
          : _cart == null || _cart!.isEmpty
          ? _buildEmptyCart()
          : _buildCartContent(),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacing32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_bag_outlined,
                size: 46,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: AppTheme.spacing24),
            Text(
              'Your cart is empty',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppTheme.spacing8),
            Text(
              'Discover our premium products and add your favourites',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: AppTheme.spacing32),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Continue Shopping'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartContent() {
    return Stack(
      children: [
        Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                color: AppTheme.primaryColor,
                onRefresh: _loadCart,
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                    AppTheme.spacing16,
                    AppTheme.spacing16,
                    AppTheme.spacing16,
                    AppTheme.spacing16,
                  ),
                  itemCount: _cart!.items.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: AppTheme.spacing12),
                  itemBuilder: (context, index) {
                    final item = _cart!.items[index];
                    return _CartItemCard(
                      item: item,
                      onQuantityChanged: (q) => _updateQuantity(item.id, q),
                      onRemove: () => _removeItem(item.id),
                      isUpdating: _isUpdating,
                    );
                  },
                ),
              ),
            ),
            _buildOrderSummary(),
          ],
        ),
        if (_isUpdating)
          Container(
            color: Colors.black.withValues(alpha: 0.18),
            child: const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            ),
          ),
      ],
    );
  }

  Widget _buildOrderSummary() {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.spacing20,
        AppTheme.spacing20,
        AppTheme.spacing20,
        AppTheme.spacing8,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -6),
          ),
        ],
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppTheme.radius2xl),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppTheme.spacing16),
              decoration: BoxDecoration(
                color: AppTheme.borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_cart!.itemCount} item${_cart!.itemCount != 1 ? 's' : ''}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Total',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
                Text(
                  '₹${_cart!.total.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacing16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CheckoutScreen(cart: _cart!),
                    ),
                  );
                },
                child: const Text('Proceed to Checkout'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Cart Item Card ─────────────────────────────────────────────────

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final Function(int) onQuantityChanged;
  final VoidCallback onRemove;
  final bool isUpdating;

  const _CartItemCard({
    required this.item,
    required this.onQuantityChanged,
    required this.onRemove,
    required this.isUpdating,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final variantText = item.variant.attributes.entries
        .map((e) => '${e.key}: ${e.value}')
        .join(' · ');

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(
          color: isDark ? const Color(0xFF363636) : AppTheme.borderColor,
          width: 1,
        ),
        boxShadow: AppTheme.softShadow,
      ),
      child: Row(
        children: [
          // Gold left accent bar
          Container(
            width: 4,
            height: 90,
            decoration: BoxDecoration(
              gradient: AppTheme.premiumGradient,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(AppTheme.radiusLg),
                bottomLeft: Radius.circular(AppTheme.radiusLg),
              ),
            ),
          ),

          // Product image
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacing12),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              child: item.product.images.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: item.product.images.first,
                      width: 76,
                      height: 76,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        width: 76,
                        height: 76,
                        color: isDark ? const Color(0xFF2A2A2A) : AppTheme.cream,
                      ),
                      errorWidget: (_, __, ___) => Container(
                        width: 76,
                        height: 76,
                        color: isDark ? const Color(0xFF2A2A2A) : AppTheme.cream,
                        child: const Icon(Icons.image_outlined, color: AppTheme.textTertiary),
                      ),
                    )
                  : Container(
                      width: 76,
                      height: 76,
                      color: isDark ? const Color(0xFF2A2A2A) : AppTheme.cream,
                      child: const Icon(Icons.image_outlined, color: AppTheme.textTertiary),
                    ),
            ),
          ),

          // Details
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0, 12, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + Remove
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          item.product.name,
                          style: Theme.of(context).textTheme.titleSmall,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      GestureDetector(
                        onTap: isUpdating ? null : onRemove,
                        child: Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: Icon(
                            Icons.close_rounded,
                            size: 18,
                            color: AppTheme.textTertiary,
                          ),
                        ),
                      ),
                    ],
                  ),

                  if (variantText.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      variantText,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  const SizedBox(height: 10),

                  // Price + Quantity controls
                  Row(
                    children: [
                      Text(
                        '₹${item.variant.price.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      // Quantity stepper
                      Container(
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF2A2A2A)
                              : AppTheme.backgroundColor,
                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _StepperButton(
                              icon: Icons.remove,
                              onTap: isUpdating || item.quantity <= 1
                                  ? null
                                  : () => onQuantityChanged(item.quantity - 1),
                            ),
                            SizedBox(
                              width: 28,
                              child: Text(
                                '${item.quantity}',
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ),
                            _StepperButton(
                              icon: Icons.add,
                              onTap: isUpdating || item.quantity >= item.variant.stock
                                  ? null
                                  : () => onQuantityChanged(item.quantity + 1),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  if (!item.available) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Out of stock',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.accentColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _StepperButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30,
        height: 30,
        alignment: Alignment.center,
        child: Icon(
          icon,
          size: 15,
          color: onTap != null
              ? Theme.of(context).colorScheme.onSurface
              : AppTheme.textTertiary,
        ),
      ),
    );
  }
}
