import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config/theme.dart';
import 'config/constants.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'screens/home/home_screen.dart';
import 'screens/auth/login_screen.dart';
import 'package:flutter_svg/flutter_svg.dart';

// Global theme notifier
final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.light);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set status bar color
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize services
  await ApiService().init();
  await AuthService().init();

  // Load saved theme preference
  final prefs = await SharedPreferences.getInstance();
  final isDark = prefs.getBool('is_dark_mode') ?? false;
  themeNotifier.value = isDark ? ThemeMode.dark : ThemeMode.light;

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (context, mode, _) {
        return MaterialApp(
          title: AppConstants.appName,
          debugShowCheckedModeBanner: false,
          theme: AppTheme.buildTheme(),
          darkTheme: AppTheme.buildDarkTheme(),
          themeMode: mode,
          home: const SplashScreen(),
        );
      },
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  List<dynamic> _splashScreens = [];
  int _currentIndex = 0;
  bool _isLoading = true;
  bool _isNavigating = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchSplashAndCheckAuth();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchSplashAndCheckAuth() async {
    try {
      // 1. Fetch splash config from API
      final response = await ApiService().get<Map<String, dynamic>>(
        '/api/app-config',
        fromJson: (json) => json as Map<String, dynamic>,
      );

      if (response.success && response.data != null && mounted) {
        final config = response.data!['config'];
        setState(() {
          _splashScreens = List<dynamic>.from(config['splashScreens'] ?? []);
        });
      }
    } catch (e) {
      debugPrint('Failed to load splash config: $e');
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (_splashScreens.isEmpty) {
      // Fallback: wait a minimum time so the fallback UI doesnt flash too fast
      await Future.delayed(const Duration(seconds: 2));
      _navigate();
    } else {
      // Start the auto-advancing sequence
      _startSequence();
    }
  }

  void _startSequence() {
    _timer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_currentIndex < _splashScreens.length - 1) {
        setState(() {
          _currentIndex++;
        });
      } else {
        timer.cancel();
        _navigate();
      }
    });
  }

  void _navigate() {
    if (!mounted || _isNavigating) return;
    _isNavigating = true;

    final authService = AuthService();
    // Navigate based on auth status
    if (authService.isAuthenticated) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    } else {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  Color _parseColor(String hexColor, Color fallback) {
    hexColor = hexColor.toUpperCase().replaceAll("#", "");
    if (hexColor.length == 6) {
      hexColor = "FF$hexColor";
    }
    return int.tryParse(hexColor, radix: 16) != null
        ? Color(int.parse(hexColor, radix: 16))
        : fallback;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // If disabled via backend or empty, fallback to default UI immediately
    if (_splashScreens.isEmpty) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: AppTheme.warmGradient),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  AppConstants.appName,
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppTheme.spacing16),
                Text(
                  AppConstants.appDescription,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppTheme.spacing48),
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Dynamic UI sequence
    final currentScreen = _splashScreens[_currentIndex];

    final bgColor = currentScreen['backgroundColor'] != null
        ? _parseColor(currentScreen['backgroundColor'], Colors.white)
        : Colors.white;

    final title = currentScreen['title'] ?? AppConstants.appName;
    final description =
        currentScreen['description'] ?? AppConstants.appDescription;
    final imageUrl = currentScreen['imageUrl'];
    final imageType = currentScreen['imageType'];

    return Scaffold(
      backgroundColor: bgColor,
      body: Center(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          child: Column(
            key: ValueKey<int>(
              _currentIndex,
            ), // Ensures transition animates per index
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (imageUrl != null && imageUrl.toString().isNotEmpty) ...[
                if (imageType == 'svg')
                  SvgPicture.network(
                    imageUrl,
                    height: 120,
                    width: 120,
                    placeholderBuilder: (BuildContext context) =>
                        const SizedBox(
                          height: 120,
                          width: 120,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                  )
                else
                  Image.network(
                    imageUrl,
                    height: 120,
                    width: 120,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const SizedBox(
                        height: 120,
                        width: 120,
                        child: Center(child: CircularProgressIndicator()),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.broken_image,
                      size: 120,
                      color: Colors.grey,
                    ),
                  ),
                const SizedBox(height: AppTheme.spacing32),
              ],
              Text(
                title,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppTheme.spacing16),
              Text(
                description,
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: AppTheme.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppTheme.spacing48),

              // Progress dots indicator
              if (_splashScreens.length > 1)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_splashScreens.length, (idx) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 8,
                      width: idx == _currentIndex ? 24 : 8,
                      decoration: BoxDecoration(
                        color: idx == _currentIndex
                            ? AppTheme.primaryColor
                            : AppTheme.primaryColor.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                ),

              const SizedBox(height: AppTheme.spacing24),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppTheme.primaryColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
