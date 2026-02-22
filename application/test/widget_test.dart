import 'package:flutter_test/flutter_test.dart';

import 'package:essvora/main.dart';

void main() {
  testWidgets('App Boots', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    expect(find.byType(MyApp), findsOneWidget);

    // Give time for any background timers inside the splash logic to flush out
    await tester.pumpAndSettle(const Duration(seconds: 3));
  });
}
